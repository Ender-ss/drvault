import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { User, Mail, Key, Loader2, ArrowRight } from 'lucide-react';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await register(name, email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Erro ao criar conta.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-background)] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-full h-full pointer-events-none opacity-20">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-[var(--color-brand)] blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-[var(--color-brand)] blur-[120px] rounded-full" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[var(--color-brand)] rounded-2xl mb-6 shadow-lg shadow-[var(--color-brand)]/20 -rotate-12">
            <User className="w-8 h-8 text-white rotate-12" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2">Criar Conta</h1>
          <p className="text-[var(--color-text-muted)] font-medium">Junte-se à elite do Direct Response</p>
        </div>

        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-8 shadow-2xl backdrop-blur-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-2">Nome Completo</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
                <Input
                  placeholder="Seu Nome"
                  className="pl-10 h-12 bg-[var(--color-background)] border-[var(--color-border)] focus:border-[var(--color-brand)]"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-2">E-mail</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
                <Input
                  type="email"
                  placeholder="seu@email.com"
                  className="pl-10 h-12 bg-[var(--color-background)] border-[var(--color-border)] focus:border-[var(--color-brand)]"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-2">Senha</label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
                <Input
                  type="password"
                  placeholder="••••••••"
                  className="pl-10 h-12 bg-[var(--color-background)] border-[var(--color-border)] focus:border-[var(--color-brand)]"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm text-center">
                {error}
              </div>
            )}

            <Button
              type="submit"
              variant="brand"
              className="w-full h-12 text-base font-bold"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="w-5 h-5 animate-spin mx-auto" />
              ) : (
                <span className="flex items-center justify-center gap-2">
                  Criar minha conta <ArrowRight className="w-4 h-4" />
                </span>
              )}
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-[var(--color-border)] text-center">
            <p className="text-sm text-[var(--color-text-muted)]">
              Já tem uma conta?{' '}
              <Link to="/login" className="text-[var(--color-brand)] font-bold hover:underline">
                Fazer login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
