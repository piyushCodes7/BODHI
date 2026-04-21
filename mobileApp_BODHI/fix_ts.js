const fs = require('fs');
const path = require('path');
const p = (f) => path.join('.', f);

// GradientCard
let gc = fs.readFileSync(p('src/components/GradientCard.tsx'), 'utf8');
gc = gc.replace('colors={colors ?? Gradients.signatureNeon.colors}', 'colors={(colors ?? Gradients.signatureNeon.colors) as (string | number)[]}');
fs.writeFileSync(p('src/components/GradientCard.tsx'), gc);

// useOAuthSignIn
let uo = fs.readFileSync(p('src/hooks/useOAuthSignIn.ts'), 'utf8');
uo = uo.replace('const idToken = userInfo.idToken;', 'const idToken = (userInfo as any).idToken || (userInfo as any).data?.idToken;');
fs.writeFileSync(p('src/hooks/useOAuthSignIn.ts'), uo);

// PaymentScreen
let ps = fs.readFileSync(p('src/screens/PaymentScreen.tsx'), 'utf8');
ps = ps.replace('interface Props {\n  onNavigate: (tab: NavTab) => void;\n  activeTab: NavTab;\n  onInsurancePress: () => void;\n  onBack: () => void;\n  currentUserId?: string;\n}', 'interface Props {\n  onNavigate?: (tab: NavTab) => void;\n  activeTab?: NavTab;\n  onInsurancePress?: () => void;\n  onBack?: () => void;\n  currentUserId?: string;\n  route?: any;\n  navigation?: any;\n}');
ps = ps.replace('user_id: currentUserId,', 'user_id: currentUserId ? Number(currentUserId) : 0,');
fs.writeFileSync(p('src/screens/PaymentScreen.tsx'), ps);

// HomeStack
let hs = fs.readFileSync(p('src/navigation/HomeStack.tsx'), 'utf8');
hs = hs.replace("import HomeScreen from '../screens/VaultScreen';", "import { VaultScreen as HomeScreen } from '../screens/VaultScreen';");
hs = hs.replace("backgroundColor: Colors.bgBase", "backgroundColor: Colors.darkBase");
fs.writeFileSync(p('src/navigation/HomeStack.tsx'), hs);

// GlassCard
let gc2 = fs.readFileSync(p('src/screens/Onboarding/GlassCard.tsx'), 'utf8');
gc2 = gc2.replace('bottomAccent: {', 'textBlock: {},\n  bottomAccent: {');
fs.writeFileSync(p('src/screens/Onboarding/GlassCard.tsx'), gc2);

// BodhiHeader
let bh = fs.readFileSync(p('src/components/BodhiHeader.tsx'), 'utf8');
if (!bh.includes('showMore?:')) {
  bh = bh.replace('interface BodhiHeaderProps {', 'interface BodhiHeaderProps {\n  showMore?: boolean;');
  fs.writeFileSync(p('src/components/BodhiHeader.tsx'), bh);
}

// tokens.ts
let tk = fs.readFileSync(p('src/theme/tokens.ts'), 'utf8');
tk = tk.replace("bgDeep:          '#05001F',", "bgDeep:          '#05001F',\n  neonLimeSubtle: '#eaff80',\n  neonCyan: '#00f2fe',");
if (!tk.includes('xxxl:')) {
  tk = tk.replace("xxl: 24,", "xxl: 24,\n  xxxl: 32,");
}
fs.writeFileSync(p('src/theme/tokens.ts'), tk);
