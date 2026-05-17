import React, { useState } from "react";
import { motion } from "motion/react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PharmaLogo } from "../common/Icons";
import { useAuth } from "../../hooks/useAuth";

export function AuthScreen() {
  const [authMode, setAuthMode] = useState<"google" | "login" | "signup" | "forgot">("google");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [orgName, setOrgName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { loginWithGoogle, loginWithEmail, signUpWithEmail, resetPassword } = useAuth();

  const handleGoogleLogin = async () => {
    setIsSubmitting(true);
    try {
      await loginWithGoogle();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await loginWithEmail(email, password);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await signUpWithEmail(email, password, orgName);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await resetPassword(email);
      setAuthMode("login");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-light-grey flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full"
      >
        <Card className="border-brand-blue/10 shadow-2xl bg-brand-surface overflow-hidden pt-0">
          <div className="bg-brand-blue p-6 text-center relative overflow-hidden">
            <div className="flex justify-center mb-4">
              <div className="h-16 w-16 rounded-full bg-brand-yellow flex items-center justify-center shadow-lg border-2 border-white/20">
                <PharmaLogo className="h-10 w-10" />
              </div>
            </div>
            <h1 className="text-3xl font-black text-white tracking-tighter">PharmaGuard</h1>
            <p className="text-brand-yellow font-black text-[9px] uppercase tracking-[0.15em] mt-1">
              SECURE CONTROLLED SUBSTANCE REGISTRY
            </p>
          </div>

          <CardContent className="p-6">
            {authMode === "google" ? (
              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <h2 className="text-lg font-bold text-brand-blue uppercase tracking-tight">Identity Verification Required</h2>
                  <p className="text-brand-dark-grey/60 text-xs">
                    Access to the controlled substance registry is restricted to authorized personnel.
                  </p>
                </div>
                
                <Button 
                  onClick={handleGoogleLogin}
                  disabled={isSubmitting}
                  className="w-full h-12 bg-white border border-brand-blue/10 hover:bg-gray-50 text-brand-dark-grey font-bold text-sm rounded-xl shadow-sm flex items-center justify-center gap-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <div className="h-5 w-5 border-2 border-brand-blue border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
                  )}
                  {isSubmitting ? "Syncing..." : "Continue with Google"}
                </Button>

                <div className="text-center space-y-1">
                  <p className="text-[10px] text-brand-dark-grey/50 font-medium px-4 leading-relaxed">
                    If the login popup doesn't appear, please ensure popups are allowed in your browser settings.
                  </p>
                  <div className="flex flex-col items-center gap-1">
                    <p className="text-[10px] text-brand-dark-grey/50">
                      Still having trouble?{" "}
                      <a 
                        href={window.location.href} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-brand-blue font-bold hover:underline"
                      >
                        Open in a new tab
                      </a>
                    </p>
                  </div>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-brand-grey/10"></span></div>
                  <div className="relative flex justify-center text-[10px] uppercase font-black px-2 bg-brand-surface text-brand-blue/40">or use terminal credentials</div>
                </div>

                <div className="flex gap-3">
                  <Button 
                    type="button"
                    variant="outline"
                    onClick={() => setAuthMode("login")}
                    className="flex-1 h-11 text-[10px] font-black uppercase tracking-widest border-brand-blue/20 text-brand-blue hover:bg-brand-blue/5 transition-all"
                  >
                    Login
                  </Button>
                  <Button 
                    type="button"
                    variant="outline"
                    onClick={() => setAuthMode("signup")}
                    className="flex-1 h-11 text-[10px] font-black uppercase tracking-widest border-brand-blue/20 text-brand-blue hover:bg-brand-blue/5 transition-all"
                  >
                    Register
                  </Button>
                </div>
              </div>
            ) : authMode === "login" ? (
              <form onSubmit={handleEmailLogin} className="space-y-4">
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] uppercase font-black text-brand-blue/80">Authorized Email</Label>
                    <Input 
                      type="email" 
                      placeholder=""
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-11 border-brand-blue/10 focus-visible:ring-brand-blue"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <Label className="text-[10px] uppercase font-black text-brand-blue/80">Password</Label>
                      <button 
                        type="button"
                        onClick={() => {
                          setEmail("");
                          setAuthMode("forgot");
                        }}
                        className="text-[9px] font-bold text-brand-blue/40 uppercase hover:text-brand-blue"
                      >
                        Forgot Password?
                      </button>
                    </div>
                    <Input 
                      type="password" 
                      placeholder=""
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-11 border-brand-blue/10 focus-visible:ring-brand-blue"
                      required
                    />
                  </div>
                </div>

                <Button className="w-full h-12 bg-brand-blue text-brand-yellow font-black uppercase tracking-widest text-xs" disabled={isSubmitting}>
                  {isSubmitting ? "Verifying..." : "Verify & Enter"}
                </Button>

                <div className="flex flex-col gap-2 pt-2">
                  <button 
                    type="button" 
                    onClick={() => setAuthMode("google")}
                    className="text-[10px] font-bold text-brand-grey/60 uppercase"
                  >
                    Back to Google Auth
                  </button>
                </div>
              </form>
            ) : authMode === "signup" ? (
              <form onSubmit={handleEmailSignUp} className="space-y-4">
                <div className="grid grid-cols-1 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] uppercase font-black text-brand-blue/80">Organization Name</Label>
                    <Input 
                      placeholder="UCLA Medical Center"
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                      className="h-10 border-brand-blue/10"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] uppercase font-black text-brand-blue/80">Email</Label>
                    <Input 
                      type="email" 
                      placeholder="drsmith@ucla.edu"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-10 border-brand-blue/10"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] uppercase font-black text-brand-blue/80">Password</Label>
                    <Input 
                      type="password" 
                      placeholder="Minimum 6 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-10 border-brand-blue/10"
                      required
                      minLength={6}
                    />
                  </div>
                </div>

                <Button className="w-full h-11 bg-brand-blue text-brand-yellow font-black uppercase tracking-widest text-xs mt-2" disabled={isSubmitting}>
                  {isSubmitting ? "Provisioning..." : "Register Organization"}
                </Button>

                <button 
                  type="button" 
                  onClick={() => setAuthMode("google")}
                  className="w-full text-[10px] font-bold text-brand-grey/60 uppercase"
                >
                  Already registered? Sign In
                </button>
              </form>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="space-y-2 text-center">
                  <h2 className="text-base font-bold text-primary">Reset Password</h2>
                  <p className="text-[11px] text-muted-foreground">Enter your email to receive a secure recovery link.</p>
                </div>
                <Input 
                  type="email" 
                  placeholder=""
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 border-brand-blue/10"
                  required
                />
                <Button className="w-full h-11 bg-brand-blue text-brand-yellow font-black tracking-widest uppercase text-xs" disabled={isSubmitting}>
                  {isSubmitting ? "Sending..." : "Send Recovery Link"}
                </Button>
                <button 
                  type="button" 
                  onClick={() => setAuthMode("google")}
                  className="w-full text-[10px] font-bold text-brand-grey/60 uppercase"
                >
                  Back to Login Options
                </button>
              </form>
            )}

            <div className="pt-6 border-t border-brand-grey/10 text-center mt-6">
              <p className="text-[9px] text-brand-dark-grey/30 uppercase font-black tracking-widest">
                Compliant with DEA Title 21 CFR Part 1300-1321
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
