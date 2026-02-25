import * as Lucide from 'lucide-react';
console.log('Available icons count:', Object.keys(Lucide).length);
console.log('Has CheckCircle2:', 'CheckCircle2' in Lucide);
console.log('Has FileCheck2:', 'FileCheck2' in Lucide);
console.log('Has AlertCircle:', 'AlertCircle' in Lucide);
console.log('Has Clock:', 'Clock' in Lucide);
console.log('Sample icons:', Object.keys(Lucide).slice(0, 10));
process.exit(0);
