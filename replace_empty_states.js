const fs = require('fs');
const path = require('path');

const base = 'd:/Subash/project/insurance/insurance-project/src/app/(dashboard)';

const targets = [
  { file: 'clients/page.tsx', title: 'No Clients Yet', desc: 'Add your first client to start building your book of business.', icon: 'Users' },
  { file: 'policies/page.tsx', title: 'No Policies Found', desc: 'You have not added any active policies yet. Issue one now.', icon: 'Shield' },
  { file: 'claims/page.tsx', title: 'No Claims Tracked', desc: 'Your claim pipeline is empty. Track a new incident here.', icon: 'FileWarning' },
  { file: 'leads/page.tsx', title: 'No Incoming Leads', desc: 'Your sales pipeline is empty. Add a new prospect!', icon: 'Megaphone' },
];

targets.forEach(t => {
  const file = path.join(base, t.file);
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(
    '<EmptyState title="No content yet" description="This module is under construction." />',
    \`<EmptyState title="\${t.title}" description="\${t.desc}" ctaLabel="Add New" ctaHref="/\${t.file.split('/')[0]}/new" />\`
  );
  fs.writeFileSync(file, content);
});

console.log('Empty states updated.');
