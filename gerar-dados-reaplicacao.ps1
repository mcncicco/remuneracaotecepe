param(
    [Parameter(Mandatory = $true)]
    [string]$ObjetivaCsv,
    [Parameter(Mandatory = $true)]
    [string]$DiscursivaCsv
)

$roleColumn = 'Cargo / ' + [char]0x00C1 + 'rea'
$registrationColumn = 'Inscri' + [char]0x00E7 + [char]0x00E3 + 'o'
$objective = @(Import-Csv -LiteralPath $ObjetivaCsv -Delimiter ';' -Encoding UTF8)
$written = @(Import-Csv -LiteralPath $DiscursivaCsv -Delimiter ';' -Encoding UTF8)
if ($objective.Count -eq 0 -or $written.Count -eq 0 -or $objective[0].PSObject.Properties.Name -notcontains $roleColumn -or $written[0].PSObject.Properties.Name -notcontains $roleColumn -or $objective[0].PSObject.Properties.Name -notcontains $registrationColumn -or $written[0].PSObject.Properties.Name -notcontains $registrationColumn -or $objective[0].PSObject.Properties.Name -notcontains 'Nota objetiva' -or $written[0].PSObject.Properties.Name -notcontains 'Nota discursiva') {
    throw 'Os CSVs estao vazios ou nao possuem as colunas necessarias.'
}

$objectiveById = @{}
foreach ($entry in $objective) {
    $registration = $entry.$registrationColumn.Trim()
    if (-not $registration -or $objectiveById.ContainsKey($registration)) { throw 'Inscricao vazia ou duplicada na objetiva.' }
    $objectiveById[$registration] = $entry
}
$writtenById = @{}
foreach ($entry in $written) {
    $registration = $entry.$registrationColumn.Trim()
    if (-not $registration -or $writtenById.ContainsKey($registration) -or -not $objectiveById.ContainsKey($registration)) { throw 'Inscricao da discursiva vazia, duplicada ou ausente na objetiva.' }
    $original = $objectiveById[$registration]
    if ($entry.$roleColumn -ne $original.$roleColumn -or $entry.Nome -cne $original.Nome -or $entry.Nascimento -ne $original.Nascimento) { throw 'Dados divergentes entre objetiva e discursiva.' }
    $writtenById[$registration] = $entry
}

$culture = [System.Globalization.CultureInfo]::GetCultureInfo('pt-BR')
$data = @(
    foreach ($career in ($objective | Group-Object $roleColumn)) {
        $results = @(
            foreach ($entry in $career.Group) {
                $birth = [datetime]::MinValue
                if (-not [datetime]::TryParseExact($entry.Nascimento, 'dd/MM/yyyy', [System.Globalization.CultureInfo]::InvariantCulture, [System.Globalization.DateTimeStyles]::None, [ref]$birth)) { throw 'Data de nascimento invalida.' }
                $score = [decimal]0
                if (-not [decimal]::TryParse($entry.'Nota objetiva', [System.Globalization.NumberStyles]::Number, $culture, [ref]$score) -or $score -lt 0 -or $score -gt 100) { throw 'Nota objetiva invalida.' }
                $writtenScore = $null
                $registration = $entry.$registrationColumn.Trim()
                if ($writtenById.ContainsKey($registration)) {
                    $value = [decimal]0
                    if (-not [decimal]::TryParse($writtenById[$registration].'Nota discursiva', [System.Globalization.NumberStyles]::Number, $culture, [ref]$value) -or $value -lt 0 -or $value -gt 20) { throw 'Nota discursiva invalida.' }
                    $writtenScore = $value
                }
                [pscustomobject]@{ classificacao = $null; nome = $entry.Nome; nascimento = $entry.Nascimento; objetiva = $score; discursiva = $writtenScore; titulos = $null; final = $null }
            }
        )
        [pscustomobject]@{ cargo = $career.Name; fase = 'reaplicacao'; resultados = $results }
    }
)
if ($data.Count -ne 4) { throw 'Quantidade inesperada de cargos na reaplicacao.' }
$json = ConvertTo-Json -InputObject $data -Depth 5 -Compress
Set-Content -LiteralPath (Join-Path $PSScriptRoot 'resultado-reaplicacao.js') -Value "const contestReapplicationData = $json;" -Encoding UTF8
Write-Output "Objetiva: $($objective.Count); discursiva: $($written.Count); cargos: $($data.Count)."