const fs = require('fs');
const file = 'src/db/schema.sql';

let content = fs.readFileSync(file, 'utf8');

const target = `    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='users_profiles' AND column_name='user_id'
    ) THEN
        ALTER TABLE users_profiles ADD COLUMN user_id UUID;
    END IF;
END $$;`;

const replacement = `    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='users_profiles' AND column_name='user_id'
    ) THEN
        ALTER TABLE users_profiles ADD COLUMN user_id UUID;
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='users_profiles' AND column_name='allowed_pages'
    ) THEN
        ALTER TABLE users_profiles ADD COLUMN allowed_pages JSONB;
    END IF;
END $$;`;
              
const escapedTarget = target.replace(/[.*+?^\${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s*');
const targetRegex = new RegExp(escapedTarget, 'g');

if (targetRegex.test(content)) {
  content = content.replace(targetRegex, replacement);
  fs.writeFileSync(file, content);
  console.log('Replaced in ' + file);
} else {
  console.log('Could not find target');
}
