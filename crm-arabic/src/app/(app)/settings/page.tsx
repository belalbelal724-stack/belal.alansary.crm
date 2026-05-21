'use client';
import { useEffect, useState } from 'react';
import { User as UserIcon, Mail, Save, Moon, Sun, Loader2 } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { createClient } from '@/lib/supabase-client';
import { toast } from 'sonner';

export default function SettingsPage() {
  const supabase = createClient();
  const { theme, setTheme } = useTheme();
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setEmail(user.email || '');
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setFullName(profile?.full_name || '');
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveProfile = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from('profiles').upsert({
      id: user.id,
      full_name: fullName.trim() || null,
      email: user.email,
    });
    setSaving(false);
    if (error) { toast.error('فشل الحفظ: ' + error.message); return; }
    toast.success('✅ تم تحديث البيانات');
  };

  if (loading) {
    return <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="h-32 animate-pulse rounded-xl bg-muted" />)}</div>;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">الإعدادات</h1>
        <p className="mt-1 text-sm text-muted-foreground">إدارة حسابك وتفضيلاتك</p>
      </div>

      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><UserIcon className="h-5 w-5" /> الملف الشخصي</CardTitle>
          <CardDescription>حدّث معلوماتك الشخصية</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarFallback className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-2xl text-white">
                {(fullName[0] || email[0] || 'U').toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold">{fullName || 'بدون اسم'}</p>
              <p className="text-sm text-muted-foreground">{email}</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>الاسم الكامل</Label>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>البريد الإلكتروني</Label>
              <div className="relative">
                <Mail className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input value={email} disabled className="pr-10 opacity-60" />
              </div>
            </div>
          </div>

          <div>
            <Button onClick={saveProfile} disabled={saving} className="gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              حفظ التغييرات
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Moon className="h-5 w-5" /> المظهر</CardTitle>
          <CardDescription>اختر الوضع المفضل لديك</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setTheme('light')}
              className={`flex items-center gap-3 rounded-lg border-2 p-4 transition-all ${theme === 'light' ? 'border-primary bg-primary/5' : 'border-input'}`}
            >
              <Sun className="h-5 w-5" /> فاتح
            </button>
            <button
              onClick={() => setTheme('dark')}
              className={`flex items-center gap-3 rounded-lg border-2 p-4 transition-all ${theme === 'dark' ? 'border-primary bg-primary/5' : 'border-input'}`}
            >
              <Moon className="h-5 w-5" /> داكن
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
