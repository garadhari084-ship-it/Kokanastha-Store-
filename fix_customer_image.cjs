const fs = require('fs');
let content = fs.readFileSync('src/components/CustomerModule.tsx', 'utf8');

// Add formImageUrl state
content = content.replace(
  "const [formCreditLimit, setFormCreditLimit] = useState<number>(0);",
  "const [formCreditLimit, setFormCreditLimit] = useState<number>(0);\n  const [formImageUrl, setFormImageUrl] = useState('');"
);

// Add to handleSaveCustomer
content = content.replace(
  "is_loyal_member: formIsLoyalMember",
  "is_loyal_member: formIsLoyalMember,\n          image_url: formImageUrl"
);
content = content.replace(
  "is_loyal_member: formIsLoyalMember\n        });",
  "is_loyal_member: formIsLoyalMember,\n          image_url: formImageUrl\n        });"
);

// Reset in handleNewCustomer
content = content.replace(
  "setFormCreditLimit(0);",
  "setFormCreditLimit(0);\n    setFormImageUrl('');"
);

// Set in handleEditCustomer
content = content.replace(
  "setFormCreditLimit(cust.credit_limit);",
  "setFormCreditLimit(cust.credit_limit);\n    setFormImageUrl(cust.image_url || '');"
);

// Add Image Upload UI in Modal
const imgUploadUI = `
                <div className="space-y-1 md:col-span-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Customer Profile Image</label>
                  <div className="flex items-center gap-4">
                    {formImageUrl ? (
                      <img src={formImageUrl} alt="Preview" className="w-16 h-16 rounded-full object-cover border border-slate-200" />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200 text-slate-400">
                        <Users size={24} />
                      </div>
                    )}
                    <div className="flex-1">
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setFormImageUrl(reader.result as string);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="w-full text-[11px]"
                      />
                      <p className="text-[9px] text-slate-400 mt-1">Upload a shop or profile picture (max 1MB recommended).</p>
                    </div>
                  </div>
                </div>
`;

content = content.replace(
  /<div className="grid grid-cols-1 md:grid-cols-2 gap-4">/,
  `<div className="grid grid-cols-1 md:grid-cols-2 gap-4">` + imgUploadUI
);

fs.writeFileSync('src/components/CustomerModule.tsx', content);
