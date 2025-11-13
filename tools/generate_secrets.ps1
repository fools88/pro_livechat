# generate_secrets.ps1 - generate random secrets and write to tmp_new_secrets.txt
$bytes = New-Object byte[] 32
[System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
$PG = [Convert]::ToBase64String($bytes)

$bytes2 = New-Object byte[] 32
[System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes2)
$MINIO = [Convert]::ToBase64String($bytes2)

$bytes3 = New-Object byte[] 32
[System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes3)
$JWT = [Convert]::ToBase64String($bytes3)

$bytes4 = New-Object byte[] 48
[System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes4)
$WIDGET = [Convert]::ToBase64String($bytes4)

"PASSWORDS_GENERATED"
$PG.Length
$MINIO.Length
$JWT.Length
$WIDGET.Length

Set-Content -Path .\tmp_new_secrets.txt -Value ("POSTGRES_PASSWORD=" + $PG)
Add-Content -Path .\tmp_new_secrets.txt -Value ("MINIO_ROOT_PASSWORD=" + $MINIO)
Add-Content -Path .\tmp_new_secrets.txt -Value ("CI_JWT_SECRET=" + $JWT)
Add-Content -Path .\tmp_new_secrets.txt -Value ("WIDGET_SIGNING_KEY=" + $WIDGET)

# Exit with success
exit 0
