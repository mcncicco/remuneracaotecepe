param(
    [Parameter(Mandatory = $true)]
    [string]$CsvPath,
    [Parameter(Mandatory = $true)]
    [string]$IndenizacoesCsvPath
)

$locationColumn = 'Lota' + [char]0x00E7 + [char]0x00E3 + 'o'
$functionColumn = 'Fun' + [char]0x00E7 + [char]0x00E3 + 'o gratificada /<br> Cargo em comiss' + [char]0x00E3 + 'o'
$indemnityColumn = 'Outras Indeniza' + [char]0x00E7 + [char]0x00F5 + 'es'
$rows = @(Import-Csv -LiteralPath $CsvPath -Delimiter ';' -Encoding UTF8)
if ($rows.Count -eq 0 -or $rows[0].PSObject.Properties.Name -notcontains 'Classe/<br>Faixa' -or $rows[0].PSObject.Properties.Name -notcontains $functionColumn -or @($rows | Where-Object { [string]::IsNullOrWhiteSpace($_.$locationColumn) -or [string]::IsNullOrWhiteSpace($_.Cargo) }).Count -gt 0) {
    throw 'O CSV esta vazio, nao possui as colunas necessarias ou contem registros sem cargo ou lotacao.'
}

$indemnities = @(Import-Csv -LiteralPath $IndenizacoesCsvPath -Delimiter ';' -Encoding UTF8)
if ($indemnities.Count -eq 0 -or $indemnities[0].PSObject.Properties.Name -notcontains $indemnityColumn -or $indemnities[0].PSObject.Properties.Name -notcontains 'Classe/<br>Faixa') {
    throw 'O CSV de indenizacoes esta vazio ou nao possui as colunas necessarias.'
}
$indemnitiesByName = @{}
foreach ($indemnity in $indemnities) {
    if ([string]::IsNullOrWhiteSpace($indemnity.Nome) -or $indemnitiesByName.ContainsKey($indemnity.Nome.Trim())) {
        throw 'O CSV de indenizacoes contem nomes vazios ou duplicados.'
    }
    $indemnitiesByName[$indemnity.Nome.Trim()] = $indemnity
}
if ($rows.Count -ne $indemnities.Count) {
    throw 'Os arquivos possuem quantidades diferentes de registros.'
}
$seenNames = @{}
$culture = [System.Globalization.CultureInfo]::GetCultureInfo('pt-BR')
$functionByValue = @{
    '9507.00' = 'TC-FGG'
    '3119.86' = 'TC-FGS-1 / TC-FGA-3'
    '2227.12' = 'TC-FGS-2'
    '1968.57' = 'TC-FAG-1'
    '1554.14' = 'TC-FAG-2'
    '1243.22' = 'TC-FAG-3'
    '7997.56' = 'TC-FGA-1'
    '6239.82' = 'TC-FGA-2'
    '18176.36' = 'TC-FGE-1'
    '15449.95' = 'TC-FGE-2'
    '14541.08' = 'TC-FGE-3'
    '13632.23' = 'TC-FGE-4'
    '13329.28' = 'TC-FGE-5'
}
foreach ($row in $rows) {
    if ([string]::IsNullOrWhiteSpace($row.Nome) -or $seenNames.ContainsKey($row.Nome.Trim()) -or -not $indemnitiesByName.ContainsKey($row.Nome.Trim())) {
        throw 'Os arquivos contem nomes vazios, duplicados ou sem correspondencia.'
    }
    $seenNames[$row.Nome.Trim()] = $true
    $indemnity = $indemnitiesByName[$row.Nome.Trim()]
    if ($row.$locationColumn.Trim() -ne $indemnity.$locationColumn.Trim() -or $row.Cargo.Trim() -ne $indemnity.Cargo.Trim() -or $row.'Classe/<br>Faixa'.Trim() -ne $indemnity.'Classe/<br>Faixa'.Trim()) {
        throw 'Os arquivos possuem dados de lotacao, cargo ou classe divergentes.'
    }
    $indemnityAmount = [decimal]0
    if ($indemnity.$indemnityColumn -notmatch '^R\$\s*[\d\.]+,\d{2}$' -or -not [decimal]::TryParse($indemnity.$indemnityColumn.Replace('R$', '').Trim(), [System.Globalization.NumberStyles]::Number, $culture, [ref]$indemnityAmount) -or $indemnityAmount -lt 0) {
        throw 'O CSV contem valor invalido na coluna de outras indenizacoes.'
    }
    $row | Add-Member -NotePropertyName fieldPayment -NotePropertyValue ($indemnityAmount -eq [decimal]2415.02)
    $amount = [decimal]0
    if ($row.$functionColumn -notmatch '^R\$\s*[\d\.]+,\d{2}$' -or -not [decimal]::TryParse($row.$functionColumn.Replace('R$', '').Trim(), [System.Globalization.NumberStyles]::Number, $culture, [ref]$amount) -or $amount -lt 0) {
        throw 'O CSV contem valor invalido na coluna de funcao gratificada ou cargo em comissao.'
    }
    $valueKey = $amount.ToString('0.00', [System.Globalization.CultureInfo]::InvariantCulture)
    $functionCode = if ($amount -eq 0) { 'SEM_VALOR' } elseif ($functionByValue.ContainsKey($valueKey)) { $functionByValue[$valueKey] } else { 'NAO_IDENTIFICADA' }
    $row | Add-Member -NotePropertyName functionCode -NotePropertyValue $functionCode
}

$aggregated = @(
    foreach ($location in ($rows | Group-Object { $_.$locationColumn.Trim() } | Sort-Object Name)) {
        foreach ($role in ($location.Group | Group-Object { $_.Cargo.Trim() } | Sort-Object Name)) {
            foreach ($grade in ($role.Group | Group-Object { $_.'Classe/<br>Faixa'.Trim() } | Sort-Object Name)) {
                $fieldCount = @($grade.Group | Where-Object { $_.fieldPayment }).Count
                [pscustomobject]@{ lotacao = $location.Name; cargo = $role.Name; classe = $grade.Name; quantidade = $grade.Count; campo = $fieldCount }
            }
        }
    }
)
$functionAggregated = @(
    foreach ($location in ($rows | Group-Object { $_.$locationColumn.Trim() } | Sort-Object Name)) {
        foreach ($function in ($location.Group | Group-Object functionCode | Sort-Object Name)) {
            foreach ($role in ($function.Group | Group-Object { $_.Cargo.Trim() } | Sort-Object Name)) {
                foreach ($grade in ($role.Group | Group-Object { $_.'Classe/<br>Faixa'.Trim() } | Sort-Object Name)) {
                    [pscustomobject]@{ lotacao = $location.Name; codigo = $function.Name; cargo = $role.Name; classe = $grade.Name; quantidade = $grade.Count }
                }
            }
        }
    }
)
$json = ConvertTo-Json -InputObject $aggregated -Depth 3 -Compress
$functionJson = ConvertTo-Json -InputObject $functionAggregated -Depth 3 -Compress
$outputPath = Join-Path $PSScriptRoot '..\js\estatisticas-cargos.js'
Set-Content -LiteralPath $outputPath -Value "const positionsData = $json;`nconst functionData = $functionJson;" -Encoding UTF8
Write-Output "Registros: $($rows.Count); lotacoes: $(@($aggregated | Group-Object lotacao).Count); combinacoes: $($aggregated.Count)."