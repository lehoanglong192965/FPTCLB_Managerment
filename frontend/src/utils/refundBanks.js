export const REFUND_BANKS = [
  { code: 'MB', bin: '970422', name: 'MB Bank' },
  { code: 'VCB', bin: '970436', name: 'Vietcombank' },
  { code: 'BIDV', bin: '970418', name: 'BIDV' },
  { code: 'ICB', bin: '970415', name: 'VietinBank' },
  { code: 'TCB', bin: '970407', name: 'Techcombank' },
  { code: 'ACB', bin: '970416', name: 'ACB' },
  { code: 'VPB', bin: '970432', name: 'VPBank' },
  { code: 'TPB', bin: '970423', name: 'TPBank' },
  { code: 'STB', bin: '970403', name: 'Sacombank' },
  { code: 'VIB', bin: '970441', name: 'VIB' },
  { code: 'HDB', bin: '970437', name: 'HDBank' },
  { code: 'SHB', bin: '970443', name: 'SHB' },
  { code: 'OCB', bin: '970448', name: 'OCB' },
  { code: 'MSB', bin: '970426', name: 'MSB' },
  { code: 'LPB', bin: '970449', name: 'LPBank' },
  { code: 'SEAB', bin: '970440', name: 'SeABank' },
  { code: 'NAB', bin: '970428', name: 'Nam A Bank' },
  { code: 'EIB', bin: '970431', name: 'Eximbank' },
  { code: 'ABB', bin: '970425', name: 'ABBank' },
  { code: 'BAB', bin: '970409', name: 'Bac A Bank' },
  { code: 'SGB', bin: '970400', name: 'Saigonbank' },
  { code: 'PGB', bin: '970430', name: 'PGBank' },
];

export const findRefundBank = (code, name) => {
  const normalizedCode = String(code || '').trim().toUpperCase();
  const normalizedName = String(name || '').trim().toLowerCase();
  return REFUND_BANKS.find((bank) => bank.code === normalizedCode)
    || REFUND_BANKS.find((bank) => bank.name.toLowerCase() === normalizedName)
    || null;
};

export const buildRefundVietQrUrl = ({ bankCode, bankName, accountNumber, accountName, amount, reference }) => {
  const bank = findRefundBank(bankCode, bankName);
  if (!bank || !/^\d{6,19}$/.test(String(accountNumber || ''))) return null;
  const normalizedAccountName = String(accountName || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9 ]/g, ' ').toUpperCase().slice(0, 50);
  const params = new URLSearchParams({
    amount: String(Math.max(0, Math.round(Number(amount) || 0))),
    addInfo: String(reference || 'HOAN TIEN VE').replace(/[^a-zA-Z0-9 ]/g, ' ').slice(0, 25),
    accountName: normalizedAccountName,
  });
  return `https://img.vietqr.io/image/${bank.bin}-${accountNumber}-compact2.png?${params.toString()}`;
};
