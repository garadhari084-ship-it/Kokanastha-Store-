const fs = require('fs');
const file = 'src/services/store.ts';
let content = fs.readFileSync(file, 'utf8');

// 1. Add listeners array and subscribe method
content = content.replace(
  /private cache = \{/,
  `private listeners: (() => void)[] = [];
  
  public subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(l => l());
  }

  private realtimeChannel: any = null;

  public setupRealtime(businessId: string) {
    if (!isSupabaseConfigured || !supabase) return;
    if (this.realtimeChannel) return; // Already setup
    
    console.log('Setting up Supabase Realtime for business:', businessId);
    this.realtimeChannel = supabase.channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public' },
        async (payload) => {
          console.log('Realtime update received', payload);
          await this.syncFromSupabase(businessId);
          this.notifyListeners();
        }
      )
      .subscribe();
  }

  private cache = {`
);

// 2. Call notifyListeners after cache updates in syncFromSupabase
content = content.replace(
  /localStorage\.setItem\(\`omnipack_erp_\$\{key\}\`, JSON\.stringify\(data\)\);\n\s*\}/g,
  `localStorage.setItem(\`omnipack_erp_\${key}\`, JSON.stringify(data));
       }
    }
    this.notifyListeners();`
);

// Wait, the regex might not match exactly.
