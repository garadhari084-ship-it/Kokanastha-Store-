const fs = require('fs');
let code = fs.readFileSync('src/services/store.ts', 'utf8');

const newMethod = `
  public clearLocalCacheOnly() {
    safeStorage.removeItem('omnipack_erp_businesses');
    safeStorage.removeItem('omnipack_erp_profiles');
    safeStorage.removeItem('omnipack_erp_settings');

    safeStorage.setItem('omnipack_erp_categories', '[]');
    safeStorage.setItem('omnipack_erp_products', '[]');
    safeStorage.setItem('omnipack_erp_customers', '[]');
    safeStorage.setItem('omnipack_erp_suppliers', '[]');
    safeStorage.setItem('omnipack_erp_purchases', '[]');
    safeStorage.setItem('omnipack_erp_sales', '[]');
    safeStorage.setItem('omnipack_erp_stockLogs', '[]');
    safeStorage.setItem('omnipack_erp_auditLogs', '[]');
    safeStorage.setItem('omnipack_erp_packingSessions', '[]');
    safeStorage.setItem('omnipack_erp_messages', '[]');
    safeStorage.setItem('omnipack_erp_loyaltyLogs', '[]');
    safeStorage.setItem('omnipack_erp_subscriptions', '[]');
    safeStorage.setItem('omnipack_erp_comboLogs', '[]');

    this.cache = {
      businesses: PRE_SEEDED_BUSINESSES,
      profiles: PRE_SEEDED_PROFILES,
      categories: [],
      products: [],
      customers: [],
      suppliers: [],
      purchases: [],
      sales: [],
      settings: PRE_SEEDED_SETTINGS,
      stockLogs: [],
      auditLogs: [],
      packingSessions: [],
      messages: [],
      loyaltyConfigs: [],
      loyaltyLogs: [],
      subscriptions: [],
      comboLogs: []
    };
  }
`;

code = code.replace(
  /public async clearAllAndReset.*?\{/s,
  newMethod + '\n  public async clearAllAndReset(businessId?: string) {'
);

fs.writeFileSync('src/services/store.ts', code);
