import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, Lock, ArrowRight, Loader2, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import { PulseFXLogo } from '@/components/PulseFXLogo';
import { ThemeToggle } from '@/components/ThemeToggle';
import * as authRepo from '@/repositories/authRepository';

const authSchema = z.object({
  email: z.string().email('Por favor, insira um e-mail válido'),
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
});

type AuthMode = 'login' | 'signup' | 'forgot';

export default function Auth() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signIn, signUp, user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  if (!loading && user) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (mode === 'forgot') {
        const emailCheck = z.string().email().safeParse(email);
        if (!emailCheck.success) {
          toast({ title: 'Erro', description: 'Insira um e-mail válido', variant: 'destructive' });
          return;
        }
        const redirectUrl = `${window.location.origin}/auth`;
        const { error } = await authRepo.resetPassword(email, redirectUrl);
        if (error) {
          toast({ title: 'Erro', description: error.message, variant: 'destructive' });
        } else {
          toast({ title: 'E-mail enviado', description: 'Verifique sua caixa de entrada para redefinir sua senha.' });
          setMode('login');
        }
        return;
      }

      const validation = authSchema.safeParse({ email, password });
      if (!validation.success) {
        toast({ title: 'Erro de Validação', description: validation.error.errors[0].message, variant: 'destructive' });
        return;
      }

      if (mode === 'login') {
        const { error } = await signIn(email, password);
        if (error) {
          toast({
            title: 'Falha ao Entrar',
            description: error.message === 'Invalid login credentials'
              ? 'E-mail ou senha inválidos.'
              : error.message,
            variant: 'destructive',
          });
        } else {
          navigate('/');
        }
      } else {
        const { error } = await signUp(email, password);
        if (error) {
          toast({
            title: 'Falha ao Cadastrar',
            description: error.message.includes('already registered')
              ? 'Já existe uma conta com este e-mail.'
              : error.message,
            variant: 'destructive',
          });
        } else {
          toast({ title: 'Verifique seu E-mail', description: 'Enviamos um link de confirmação.' });
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const titles: Record<AuthMode, string> = {
    login: 'Bem-vindo de volta',
    signup: 'Criar conta',
    forgot: 'Redefinir senha',
  };

  const subtitles: Record<AuthMode, string> = {
    login: 'Entre para acessar seu painel',
    signup: 'Comece a monitorar taxas de câmbio hoje',
    forgot: 'Informe seu e-mail para receber o link de redefinição',
  };

  return (
    <div className="min-h-screen flex bg-background">
      <div className="absolute top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-background" />
        <div className="absolute inset-0 bg-gradient-gold-subtle opacity-30" />
        <div className="relative z-10 flex flex-col justify-between p-12">
          <PulseFXLogo size="lg" />
          <div className="max-w-md">
            <h2 className="text-4xl font-bold text-foreground leading-tight mb-6">
              Monitoramento de câmbio em tempo real com{' '}
              <span className="text-gradient-gold">insights acionáveis</span>
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Acompanhe taxas de câmbio em tempo real, identifique janelas de oportunidade
              e receba alertas personalizados para otimizar suas operações de câmbio.
            </p>
            <div className="mt-8 grid grid-cols-3 gap-4">
              {['USD/BRL', 'EUR/BRL', 'CNY/BRL'].map((pair) => (
                <div key={pair} className="glass-card rounded-lg p-3 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Monitorar</p>
                  <p className="text-sm font-semibold text-foreground">{pair}</p>
                </div>
              ))}
            </div>
          </div>
          <p className="text-xs text-muted-foreground">© 2026 PulseFX. Inteligência Cambial.</p>
        </div>
      </div>

      {/* Right Panel - Auth Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center justify-center mb-8">
            <PulseFXLogo size="lg" />
          </div>

          <div className="glass-card rounded-2xl p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-2">{titles[mode]}</h2>
              <p className="text-sm text-muted-foreground">{subtitles[mode]}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm text-foreground">E-mail</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="voce@empresa.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 bg-secondary border-border focus:border-primary"
                    required
                  />
                </div>
              </div>

              {mode !== 'forgot' && (
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm text-foreground">Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 bg-secondary border-border focus:border-primary"
                      required
                    />
                  </div>
                </div>
              )}

              {mode === 'login' && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setMode('forgot')}
                    className="text-xs text-primary hover:underline"
                  >
                    Esqueceu a senha?
                  </button>
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-gradient-gold hover:opacity-90 text-primary-foreground font-medium"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    {mode === 'login' && 'Entrar'}
                    {mode === 'signup' && 'Criar Conta'}
                    {mode === 'forgot' && 'Enviar Link'}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center space-y-2">
              {mode === 'forgot' ? (
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center justify-center gap-1 mx-auto"
                >
                  <ArrowLeft className="h-3 w-3" />
                  Voltar ao login
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  {mode === 'login' ? (
                    <>Não tem uma conta? <span className="text-primary font-medium">Cadastre-se</span></>
                  ) : (
                    <>Já tem uma conta? <span className="text-primary font-medium">Entrar</span></>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
