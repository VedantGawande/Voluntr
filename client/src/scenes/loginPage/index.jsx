import { useState } from "react";
import { Alert, Box, Button, Card, CardContent, Divider, FormControl, InputLabel, MenuItem, Select, Stack, TextField, Typography } from "@mui/material";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { setLogin } from "state";
import { apiRequest } from "api";

const LoginPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [mode, setMode] = useState("login");
  const [values, setValues] = useState({ name: "", email: "", password: "", role: "volunteer" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const isRegister = mode === "register";

  const update = (field) => (event) => setValues((current) => ({ ...current, [field]: event.target.value }));
  const submit = async (event) => {
    event.preventDefault();
    setError(""); setSuccess("");
    if (!values.email.trim() || !values.password) return setError("Enter your email and password.");
    if (isRegister && values.name.trim().length < 2) return setError("Enter your name.");
    if (isRegister && values.password.length < 8) return setError("Password must be at least 8 characters.");
    setLoading(true);
    try {
      if (isRegister) {
        const result = await apiRequest("/auth/register", null, { method: "POST", body: JSON.stringify(values) });
        setSuccess(result.message || "Account created. Please log in.");
        setMode("login");
        setValues((current) => ({ ...current, password: "" }));
      } else {
        const result = await apiRequest("/auth/login", null, { method: "POST", body: JSON.stringify({ email: values.email, password: values.password }) });
        dispatch(setLogin({ user: result.user, token: result.token }));
        navigate("/home");
      }
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center", p: 2, background: "linear-gradient(135deg, #e7f2ef 0%, #f7f8f5 55%, #f9eee2 100%)" }}>
      <Box sx={{ width: "min(980px, 100%)", display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, overflow: "hidden", borderRadius: 5, boxShadow: "0 24px 80px rgba(31,75,69,.13)", bgcolor: "white" }}>
        <Box sx={{ p: { xs: 4, md: 6 }, color: "white", background: "linear-gradient(145deg, #174c49, #287b72)", display: "flex", flexDirection: "column", justifyContent: "space-between", minHeight: 520 }}>
          <Box>
            <Typography variant="h4" fontWeight={800} letterSpacing={-1}>voluntr<span style={{ color: "#f1b779" }}>.</span></Typography>
            <Typography sx={{ mt: 7, fontSize: { xs: 30, md: 38 }, lineHeight: 1.15, fontWeight: 800 }}>Small actions.<br />Meaningful change.</Typography>
            <Typography sx={{ mt: 2, color: "rgba(255,255,255,.8)", maxWidth: 340, lineHeight: 1.8 }}>Find volunteer opportunities, connect with organizations and make your time count.</Typography>
          </Box>
          <Typography variant="body2" sx={{ color: "rgba(255,255,255,.65)" }}>A simple platform for people who want to help.</Typography>
        </Box>
        <CardContent sx={{ p: { xs: 3, md: 5 }, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <Typography variant="h5" fontWeight={800}>{isRegister ? "Create your account" : "Welcome back"}</Typography>
          <Typography color="text.secondary" sx={{ mt: 1, mb: 3 }}>{isRegister ? "Join as a volunteer or register your organization." : "Log in to continue to Voluntr."}</Typography>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
          <form onSubmit={submit}>
            <Stack spacing={2}>
              {isRegister && <TextField label="Full name" value={values.name} onChange={update("name")} required fullWidth />}
              <TextField label="Email address" type="email" value={values.email} onChange={update("email")} required fullWidth />
              <TextField label="Password" type="password" value={values.password} onChange={update("password")} required fullWidth helperText={isRegister ? "At least 8 characters" : ""} />
              {isRegister && (
                <FormControl fullWidth>
                  <InputLabel>Account type</InputLabel>
                  <Select label="Account type" value={values.role} onChange={update("role")}>
                    <MenuItem value="volunteer">Volunteer</MenuItem>
                    <MenuItem value="organization">Organization</MenuItem>
                  </Select>
                </FormControl>
              )}
              <Button type="submit" variant="contained" size="large" disabled={loading} sx={{ py: 1.4, mt: 1 }}>{loading ? "Please wait…" : isRegister ? "Create account" : "Log in"}</Button>
            </Stack>
          </form>
          <Divider sx={{ my: 3 }} />
          <Typography textAlign="center" color="text.secondary">
            {isRegister ? "Already have an account? " : "New to Voluntr? "}
            <Button variant="text" onClick={() => { setMode(isRegister ? "login" : "register"); setError(""); setSuccess(""); }} sx={{ minWidth: 0, px: .5 }}>{isRegister ? "Log in" : "Create an account"}</Button>
          </Typography>
          <Typography variant="caption" color="text.secondary" textAlign="center" sx={{ mt: 2 }}>Admin accounts are created manually by the project team.</Typography>
        </CardContent>
      </Box>
    </Box>
  );
};

export default LoginPage;
