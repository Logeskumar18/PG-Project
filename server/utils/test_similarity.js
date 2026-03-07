import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const runTest = async () => {
  // Sample Data
  const newTitle = "Online Project Monitoring";
  const existingTitles = [
    "Online Project Monitoring System",
    "Library Management System", 
    "Attendance System"
  ];

  console.log(`Checking similarity for: "${newTitle}"`);
  console.log(`Against: ${JSON.stringify(existingTitles, null, 2)}`);

  const pythonProcess = spawn('python', [path.join(__dirname, 'similarity.py')]);
  
  let result = '';
  pythonProcess.stdout.on('data', (data) => {
    result += data.toString();
  });

  pythonProcess.stderr.on('data', (data) => {
    console.error(`Python Error: ${data}`);
  });

  pythonProcess.on('close', (code) => {
    try {
      const jsonResponse = JSON.parse(result);
      console.log('\n--- Result ---');
      console.log(JSON.stringify(jsonResponse, null, 2));
    } catch (e) {
      console.error('Failed to parse result:', result);
    }
  });

  pythonProcess.stdin.write(JSON.stringify({ new_title: newTitle, existing_titles: existingTitles }));
  pythonProcess.stdin.end();
};

runTest();