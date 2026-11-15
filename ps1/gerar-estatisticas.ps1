param(
    [Parameter(Mandatory = $true)]
    [string]$CsvPath,
    [Parameter(Mandatory = $true)]
    [string]$IndenizacoesCsvPath,
    [string]$LegendCsvPath,
    [string]$FunctionLegendCsvPath
)

$LegendCsvPath = if ([string]::IsNullOrWhiteSpace($LegendCsvPath)) { Join-Path $PSScriptRoot '..\csv\legendas-lotacoes.csv' } else { $LegendCsvPath }
$FunctionLegendCsvPath = if ([string]::IsNullOrWhiteSpace($FunctionLegendCsvPath)) { Join-Path $PSScriptRoot '..\csv\legendas-funcoes.csv' } else { $FunctionLegendCsvPath }
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
$legends = @(Import-Csv -LiteralPath $LegendCsvPath -Delimiter ';' -Encoding UTF8)
if ($legends.Count -eq 0 -or $legends[0].PSObject.Properties.Name -notcontains 'sigla_lotacao' -or $legends[0].PSObject.Properties.Name -notcontains 'legenda') {
    throw 'O CSV de legendas esta vazio ou nao possui as colunas necessarias.'
}
$locationLabels = @{}
$seenLegendCodes = @{}
foreach ($legend in $legends) {
    $code = $legend.sigla_lotacao.Trim()
    if ([string]::IsNullOrWhiteSpace($code) -or $seenLegendCodes.ContainsKey($code)) {
        throw 'O CSV de legendas contem siglas vazias ou duplicadas.'
    }
    $seenLegendCodes[$code] = $true
    if (-not [string]::IsNullOrWhiteSpace($legend.legenda)) {
        $locationLabels[$code] = $legend.legenda.Trim()
    }
}
$functionLegends = @(Import-Csv -LiteralPath $FunctionLegendCsvPath -Delimiter ';' -Encoding UTF8)
if ($functionLegends.Count -eq 0 -or $functionLegends[0].PSObject.Properties.Name -notcontains 'codigo_funcao' -or $functionLegends[0].PSObject.Properties.Name -notcontains 'legenda') {
    throw 'O CSV de legendas de funcoes esta vazio ou nao possui as colunas necessarias.'
}
$functionLabels = @{}
$seenFunctionCodes = @{}
foreach ($functionLegend in $functionLegends) {
    $code = $functionLegend.codigo_funcao.Trim()
    if ([string]::IsNullOrWhiteSpace($code) -or $seenFunctionCodes.ContainsKey($code)) {
        throw 'O CSV de legendas de funcoes contem codigos vazios ou duplicados.'
    }
    $seenFunctionCodes[$code] = $true
    if (-not [string]::IsNullOrWhiteSpace($functionLegend.legenda)) {
        $functionLabels[$code] = $functionLegend.legenda.Trim()
    }
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
$locationLabelsJson = if ($locationLabels.Count -gt 0) { ConvertTo-Json -InputObject ([pscustomobject]$locationLabels) -Compress } else { '{}' }
$functionLabelsJson = if ($functionLabels.Count -gt 0) { ConvertTo-Json -InputObject ([pscustomobject]$functionLabels) -Compress } else { '{}' }
$outputPath = Join-Path $PSScriptRoot '..\js\estatisticas-cargos.js'
Set-Content -LiteralPath $outputPath -Value "const positionsData = $json;`nconst functionData = $functionJson;`nconst locationLabels = $locationLabelsJson;`nconst functionLabels = $functionLabelsJson;" -Encoding UTF8
Write-Output "Registros: $($rows.Count); lotacoes: $(@($aggregated | Group-Object lotacao).Count); combinacoes: $($aggregated.Count)."