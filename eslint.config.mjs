import coreWebVitals from "eslint-config-next/core-web-vitals";
import typescript from "eslint-config-next/typescript";

/**
 * ESLint flat config (ESLint 9 / Next 16). `next lint` was removed in Next 16,
 * so linting runs ESLint directly via the `lint` npm script.
 */
const config = [
  ...coreWebVitals,
  ...typescript,
  {
    // These two are new, experimental React-Compiler rules in Next 16's config.
    // They flag patterns that are correct here, so they're kept as warnings
    // (visible, non-blocking) rather than errors:
    //  - purity: server components legitimately read the clock during render
    //    (e.g. computing coupon expiry), which is deterministic per request.
    //  - set-state-in-effect: hydrating client state from an external store on
    //    mount — reading localStorage into the cart, and the next-themes mount
    //    guard — is exactly what these effects are for.
    rules: {
      "react-hooks/purity": "warn",
      "react-hooks/set-state-in-effect": "warn",
    },
  },
  {
    ignores: [".next/**", "node_modules/**", "next-env.d.ts"],
  },
];

export default config;
