'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Mail, Lock, User as UserIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { createClient } from '@/lib/supabase-client';
import { toast } from 'sonner';

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [tab, setTab] = useState<'login' | 'signup'>('login');
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) { toast.error('فشل تسجيل الدخول: ' + error.message); return; }
    toast.success('مرحباً بك مجدداً 👋');
    router.push('/dashboard');
    router.refresh();
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    setLoading(false);
    if (error) { toast.error('فشل التسجيل: ' + error.message); return; }
    toast.success('تم إنشاء الحساب! تحقق من بريدك للتأكيد.');
    setTab('login');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10 p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white shadow-2xl shadow-purple-500/40">
            <Sparkles className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-bold">CRM Pro</h1>
          <p className="mt-2 text-muted-foreground">نظام إدارة علاقات العملاء الاحترافي</p>
        </div>

        <Card className="border-2 shadow-xl">
          <CardHeader>
            <div className="grid grid-cols-2 gap-2 rounded-lg bg-muted p-1">
              <button
                onClick={() => setTab('login')}
                className={`rounded-md py-2 text-sm font-medium transition-all ${tab === 'login' ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
              >
                تسجيل الدخول
              </button>
              <button
                onClick={() => setTab('signup')}
                className={`rounded-md py-2 text-sm font-medium transition-all ${tab === 'signup' ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
              >
                إنشاء حساب
              </button>
            </div>
            <CardTitle className="pt-4">{tab === 'login' ? 'أهلاً بعودتك' : 'انضم إلينا'}</CardTitle>
            <CardDescription>
              {tab === 'login' ? 'سجّل دخولك للوصول إلى نظامك' : 'أنشئ حسابك للبدء في إدارة عملائك'}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={tab === 'login' ? handleLogin : handleSignup} className="space-y-4">
              {tab === 'signup' && (
                <div className="space-y-2">
                  <Label htmlFor="fullName">الاسم الكامل</Label>
                  <div className="relative">
                    <UserIcon className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="fullName"
                      type="text"
                      placeholder="أحمد محمد"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      className="pr-10"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">البريد الإلكتروني</Label>
                <div className="relative">
                  <Mail className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="pr-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">كلمة المرور</Label>
                <div className="relative">
                  <Lock className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="pr-10"
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {tab === 'login' ? 'تسجيل الدخول' : 'إنشاء الحساب'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          محمي بـ Supabase Auth · مشفر طوال الرحلة
        </p>
      </div>
    </div>
  );
}
