import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import { PulseFXLogo } from '@/components/PulseFXLogo';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ThemeProvider } from '@/hooks/useTheme';

const authSchema = z.object({
  email: z.string().email('Por favor, insira um e-mail válido'),
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
});

function AuthContent() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signIn, signUp, user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Redirect if already logged in
  if (!loading && user) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Validate input
    const validation = authSchema.safeParse({ email, password });
    if (!validation.success) {
      toast({
        title: 'Erro de Validação',
        description: validation.error.errors[0].message,
        variant: 'destructive',
      });
      setIsLoading(false);
      return;
    }

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          toast({
            title: 'Falha ao Entrar',
            description: error.message === 'Invalid login credentials' 
              ? 'E-mail ou senha inválidos. Por favor, tente novamente.'
              : error.message,
            variant: 'destructive',
          });
        } else {
          navigate('/');
        }
      } else {
        const { error } = await signUp(email, password);
        if (error) {
          if (error.message.includes('already registered')) {
            toast({
              title: 'Conta Existente',
              description: 'Já existe uma conta com este e-mail. Por favor, faça login.',
              variant: 'destructive',
            });
          } else {
            toast({
              title: 'Falha ao Cadastrar',
              description: error.message,
              variant: 'destructive',
            });
          }
        } else {
          toast({
            title: 'Verifique seu E-mail',
            description: 'Enviamos um link de confirmação. Por favor, verifique sua caixa de entrada.',
          });
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

  return (
    <div className="min-h-screen flex bg-background">
      {/* Theme Toggle */}
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
                <div 
                  key={pair}
                  className="glass-card rounded-lg p-3 text-center"
                >
                  <p className="text-xs text-muted-foreground mb-1">Monitorar</p>
                  <p className="text-sm font-semibold text-foreground">{pair}</p>
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            © 2026 PulseFX. Inteligência Cambial.
          </p>
        </div>
      </div>

      {/* Right Panel - Auth Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center mb-8">
            <PulseFXLogo size="lg" />
          </div>

          <div className="glass-card rounded-2xl p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-2">
                {isLogin ? 'Bem-vindo de volta' : 'Criar conta'}
              </h2>
              <p className="text-sm text-muted-foreground">
                {isLogin 
                  ? 'Entre para acessar seu painel' 
                  : 'Comece a monitorar taxas de câmbio hoje'}
              </p>
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

              <Button
                type="submit"
                className="w-full bg-gradient-gold hover:opacity-90 text-primary-foreground font-medium"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    {isLogin ? 'Entrar' : 'Criar Conta'}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                {isLogin ? (
                  <>Não tem uma conta? <span className="text-primary font-medium">Cadastre-se</span></>
                ) : (
                  <>Já tem uma conta? <span className="text-primary font-medium">Entrar</span></>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Auth() {
  return (
    <ThemeProvider>
      <AuthContent />
    </ThemeProvider>
  );
}
