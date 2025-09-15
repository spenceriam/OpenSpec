#!/usr/bin/env node

// Simple debug script to inspect localStorage content
// Run this in browser console: copy(JSON.stringify(JSON.parse(localStorage.getItem('openspec-workflow-state') || '{}'), null, 2))

console.log('OpenSpec Storage Debug Script');
console.log('=============================');

if (typeof localStorage !== 'undefined') {
  const workflowState = localStorage.getItem('openspec-workflow-state');
  
  if (workflowState) {
    try {
      const parsed = JSON.parse(workflowState);
      console.log('Workflow State Found:');
      console.log(JSON.stringify(parsed, null, 2));
      
      // Check specifically for timing and apiResponses
      console.log('\nTiming Data:');
      console.log(parsed.timing || 'Missing');
      
      console.log('\nAPI Responses:');
      console.log(parsed.apiResponses || 'Missing');
      
      // Check content
      const phases = ['requirements', 'design', 'tasks'];
      phases.forEach(phase => {
        if (parsed[phase]) {
          console.log(`\n${phase}: ${parsed[phase].length} characters`);
        } else {
          console.log(`\n${phase}: No content`);
        }
      });
      
    } catch (error) {
      console.error('Error parsing workflow state:', error);
    }
  } else {
    console.log('No workflow state found in localStorage');
  }
  
  // List all openspec related keys
  console.log('\nAll OpenSpec localStorage keys:');
  Object.keys(localStorage).filter(key => key.includes('openspec')).forEach(key => {
    console.log(`- ${key}: ${localStorage.getItem(key)?.slice(0, 100)}...`);
  });
  
} else {
  console.log('localStorage not available (run in browser console)');
}

console.log('\n=============================');
console.log('To inspect in browser console:');
console.log('JSON.parse(localStorage.getItem("openspec-workflow-state") || "{}")');