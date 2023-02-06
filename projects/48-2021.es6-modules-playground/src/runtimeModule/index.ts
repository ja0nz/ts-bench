const code = `
// Attention: no relative URL
import msg from 'http://localhost:3000/src/runtimeModule/importVal';
console.log(msg);
export default 'run adhoc';
`;

const blob = new Blob([code], { type: "application/javascript" });
const importable = URL.createObjectURL(blob);
export { blob, importable };
//  Maybe URL.revokeObjectURL(blob)
