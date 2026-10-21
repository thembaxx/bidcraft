/** Legal operator details must be supplied from verified business records before public launch. */
export const legal = {
  effectiveDate: '21 October 2026',
  operator: process.env.LEGAL_OPERATOR_NAME?.trim() || null,
  email: process.env.LEGAL_CONTACT_EMAIL?.trim() || null,
  phone: process.env.LEGAL_CONTACT_PHONE?.trim() || null,
  address: process.env.LEGAL_SERVICE_ADDRESS?.trim() || null,
  registration: process.env.LEGAL_REGISTRATION_NUMBER?.trim() || null,
};
export const legalDetailsComplete = Boolean(legal.operator && legal.email && legal.address && legal.phone);
