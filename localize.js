import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const replacements = [
  // Names
  ['Sarah Jenkins', 'Neha Sharma'],
  ['Marcus Vance', 'Rajesh Kumar'],
  ['Elena Rostova', 'Priya Desai'],
  ['David Kim', 'Amit Patel'],
  ['Robert Vance', 'Vikram Singh'],
  ['sarah-jenkins', 'neha-sharma'],
  ['marcus-vance', 'rajesh-kumar'],
  ['elena-rostova', 'priya-desai'],
  ['david-kim', 'amit-patel'],
  ['robert-vance', 'vikram-singh'],
  ["avatarText: 'SJ'", "avatarText: 'NS'"],
  ["avatarText: 'MV'", "avatarText: 'RK'"],
  ["avatarText: 'ER'", "avatarText: 'PD'"],
  ["avatarText: 'DK'", "avatarText: 'AP'"],
  ["avatarText: 'RV'", "avatarText: 'VS'"],
  
  // Bar Numbers
  ['CA #582910', 'MAH/123/2012'],
  ['NY #392815', 'DEL/456/2015'],
  ['TX #482910', 'GUJ/789/2018'],
  ['IL #928374', 'KAR/234/2014'],
  ['CA #619384', 'MAH/567/2016'],
  ['CA #928310', 'UP/890/2010'],
  ['NY #618290', 'DEL/112/2017'],
  
  // Currency and Values
  ['$150', '₹15,000'],
  ['$450', '₹45,000'],
  ['$1,800', '₹1,80,000'],
  ['$250', '₹25,000'],
  ['$600', '₹60,000'],
  ['$200', '₹20,000'],
  ['$400', '₹40,000'],
  ['$750', '₹75,000'],
  ['$220', '₹22,000'],
  ['$500', '₹50,000'],
  ['$1,200', '₹1,20,000'],
  ['$180', '₹18,000'],
  ['$800', '₹80,000'],
  ['$300', '₹30,000'],
  ['$2,500', '₹2,50,000'],
  ['$1,500', '₹1,50,000'],
  ['$2,400', '₹2,40,000'],
  ['$80 ', '₹8,000 '], // Include space to avoid matching partial $800
  ['$80)', '₹8,000)'],
  
  // Terminologies
  ['Housing Authority', 'RERA'],
  ['state labor agency', 'Labour Court'],
  ['Small Claims Prep', 'District Court Prep'],
  ['Arbitration Filing Pack', 'Consumer Forum Filing Pack'],
  ['State civil action', 'Civil court action']
];

const filesToUpdate = [
  'app.js',
  'index.html',
  'config/initDb.js'
];

filesToUpdate.forEach(fileName => {
  const filePath = path.join(__dirname, fileName);
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filePath}`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf-8');
  let newContent = content;
  
  replacements.forEach(([search, replace]) => {
    // Escape string for regex
    const escapeRegExp = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escapeRegExp(search), 'g');
    newContent = newContent.replace(regex, replace);
  });
  
  if (content !== newContent) {
    fs.writeFileSync(filePath, newContent, 'utf-8');
    console.log(`Updated ${fileName}`);
  } else {
    console.log(`No changes made to ${fileName}`);
  }
});

console.log('Localization script finished.');
