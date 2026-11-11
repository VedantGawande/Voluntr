import React, { useState } from "react";
import { Box, Button, TextField, useMediaQuery, Typography, useTheme } from "@mui/material";
import axios from "axios";
import { Formik } from "formik";
import { useParams } from "react-router-dom";
import API_URL from "api";

const ResetPassword = () => {
  const { token } = useParams();
  const { palette } = useTheme();
  const isNonMobileScreens = useMediaQuery("(min-width: 1000px)");
  const [message, setMessage] = useState('');

  return (
    <Formik
      initialValues={{ password: '' }}
      onSubmit={async (values, { setSubmitting }) => {
        try {
          await axios.post(`${API_URL}/auth/reset/${token}`, { password: values.password });
          setMessage('Password has been reset');
        } catch (error) {
          setMessage('Error resetting password');
        } finally {
          setSubmitting(false);
        }
      }}
    >
      {({ handleBlur, handleChange, values, handleSubmit, errors, touched }) => (
        <Box onSubmit={handleSubmit} component="form">
          <Box
            width="100%"
            backgroundColor={palette.background.alt}
            p="1rem 6%"
            textAlign="center"
          >
            <Typography fontWeight="bold" fontSize="32px" color="primary">
              Reset Password
            </Typography>
          </Box>

          <Box
            width={isNonMobileScreens ? "50%" : "93%"}
            p="2rem"
            m="2rem auto"
            borderRadius="1.5rem"
            backgroundColor={palette.background.alt}
          >
            <Typography fontWeight="500" variant="h5" sx={{ mb: "1.5rem" }}>
              Enter your new password
            </Typography>

            <Box display="grid" gap="30px" gridTemplateColumns="repeat(4, minmax(0, 1fr))">
              <TextField
                type="password"
                label="New Password"
                onBlur={handleBlur}
                onChange={handleChange}
                value={values.password}
                name="password"
                error={Boolean(touched.password) && Boolean(errors.password)}
                helperText={touched.password && errors.password}
                sx={{ gridColumn: "span 4" }}
              />
            </Box>

            <Box>
              <Button
                fullWidth
                type="submit"
                sx={{
                  m: "2rem 0",
                  p: "1rem",
                  backgroundColor: palette.primary.main,
                  color: palette.background.alt,
                  "&:hover": { color: palette.primary.main },
                }}
              >
                RESET PASSWORD
              </Button>
            </Box>

            {message && <Typography>{message}</Typography>}
          </Box>
        </Box>
      )}
    </Formik>
  );
};

export default ResetPassword;
