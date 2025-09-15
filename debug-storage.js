// EMERGENCY DEBUGGING SCRIPT
// Copy and paste this into your browser console to debug storage issues

console.log('=== OPENSPEC STORAGE DEBUGGING TOOL ===');

// Check localStorage
console.log('\n1. LOCALSTORAGE CONTENTS:');
const localKeys = Object.keys(localStorage);
localKeys.forEach(key => {
  if (key.includes('openspec')) {
    const value = localStorage.getItem(key);
    console.log(`   ${key}:`, value ? JSON.parse(value) : null);
  }
});
if (localKeys.filter(k => k.includes('openspec')).length === 0) {
  console.log('   No openspec keys in localStorage ✅');
}

// Check sessionStorage
console.log('\n2. SESSIONSTORAGE CONTENTS:');
const sessionKeys = Object.keys(sessionStorage);
sessionKeys.forEach(key => {
  if (key.includes('openspec')) {
    const value = sessionStorage.getItem(key);
    console.log(`   ${key}:`, value);
  }
});
if (sessionKeys.filter(k => k.includes('openspec')).length === 0) {
  console.log('   No openspec keys in sessionStorage ✅');
}

// Check workflow state specifically
console.log('\n3. WORKFLOW STATE CHECK:');
const workflowState = localStorage.getItem('openspec-workflow-state');
if (workflowState) {
  try {
    const parsed = JSON.parse(workflowState);
    console.log('   Workflow state found:', {
      phase: parsed.phase,
      featureName: parsed.featureName,
      hasRequirements: !!parsed.requirements,
      hasDesign: !!parsed.design,
      hasTasks: !!parsed.tasks,
      requirements: parsed.requirements ? parsed.requirements.substring(0, 100) + '...' : 'EMPTY'
    });
    
    if (parsed.featureName && parsed.featureName.toLowerCase().includes('bank')) {
      console.error('   ⚠️  FOUND BANK TELLER DATA - THIS IS THE BUG!');
    }
  } catch (e) {
    console.log('   Workflow state parse error:', e);
  }
} else {
  console.log('   No workflow state found ✅');
}

// Check reset flag
console.log('\n4. RESET FLAG CHECK:');
const resetFlag = sessionStorage.getItem('openspec-just-reset');
if (resetFlag) {
  console.log('   Reset flag is SET:', resetFlag);
} else {
  console.log('   No reset flag found');
}

// Manual reset function
console.log('\n5. MANUAL EMERGENCY RESET FUNCTION:');
console.log('Run this if you need to manually clear everything:');
console.log(`
window.emergencyReset = function() {
  console.log('MANUAL EMERGENCY RESET STARTING...');
  localStorage.clear();
  sessionStorage.clear();
  sessionStorage.setItem('openspec-just-reset', 'true');
  console.log('MANUAL RESET COMPLETE - RELOAD THE PAGE');
};

// Then call: window.emergencyReset()
`);

window.emergencyReset = function() {
  console.log('MANUAL EMERGENCY RESET STARTING...');
  localStorage.clear();
  sessionStorage.clear();
  sessionStorage.setItem('openspec-just-reset', 'true');
  console.log('MANUAL RESET COMPLETE - RELOAD THE PAGE');
  window.location.reload();
};

console.log('\n=== DEBUGGING COMPLETE ===');
console.log('If you see bank teller data, run: window.emergencyReset()');