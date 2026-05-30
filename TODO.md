# TODO

- [ ] Update `src/app/profile/page.tsx` to support numeric OTP entry (code input UI)
- [ ] After entering code, call `supabase.auth.verifyOtp(...)` using the same email (and correct OTP type)
- [ ] Handle success/failure states and redirect/session update
- [ ] Keep existing magic-link flow if desired, or replace “Send OTP” button behavior
- [ ] Run `npm run lint` and `npm run build` (or `npm run dev` + manual verification)
