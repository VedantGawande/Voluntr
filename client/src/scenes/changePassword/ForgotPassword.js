import React, { useState } from "react";
import { Box, Button, TextField, useMediaQuery, Typography, useTheme } from "@mui/material";
import axios from "axios";
import { Formik } from "formik";
import API_URL from "api";

const ForgotPassword = () => {
  const { palette } = useTheme();
  const isNonMobile = useMediaQuery("(min-width:600px)");
  const [message, setMessage] = useState('');
  const isNonMobileScreens = useMediaQuery("(min-width: 1000px)");

  return (
    <Formik
      initialValues={{ email: '' }}
      onSubmit={async (values, { setSubmitting }) => {
        try {
          await axios.post(`${API_URL}/auth/forgot`, { email: values.email });
          setMessage('Check your email for a reset link');
        } catch (error) {
          setMessage('Error sending reset link');
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
              VolunTree
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
              Enter email to get password reset link
            </Typography>
            <Box
              display="grid"
              gap="30px"
              gridTemplateColumns="repeat(4, minmax(0, 1fr))"
              sx={{
                "& > div": { gridColumn: isNonMobile ? undefined : "span 4" },
              }}
            >
              <TextField
              label="Email"
              onBlur={handleBlur}
              onChange={handleChange}
              value={values.email}
              name="email"
              error={Boolean(touched.email) && Boolean(errors.email)}
              helperText={touched.email && errors.email}
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
                SEND RESET LINK
              </Button>
            </Box>
            <Box>
              {message && <Typography>{message}</Typography>}
            </Box>
          </Box>
          
          
          

        </Box>
      )}
    </Formik>
  );
};

export default ForgotPassword;
