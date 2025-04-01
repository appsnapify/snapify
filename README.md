[14:26:09.809] Cloning github.com/appsnapify/snapify (Branch: main, Commit: 80c158c)
[14:26:09.828] Skipping build cache, deployment was triggered without cache.
[14:26:10.336] Cloning completed: 526.000ms
[14:26:10.552] Running build in Washington, D.C., USA (East) – iad1
[14:26:10.696] Running "vercel build"
[14:26:11.078] Vercel CLI 41.4.1
[14:26:12.827] Installing dependencies...
[14:26:15.998] npm warn deprecated rimraf@3.0.2: Rimraf versions prior to v4 are no longer supported
[14:26:16.703] npm warn deprecated inflight@1.0.6: This module is not supported, and leaks memory. Do not use it. Check out lru-cache if you want a good and tested way to coalesce async requests by a key value, which is much more comprehensive and powerful.
[14:26:16.771] npm warn deprecated glob@7.2.3: Glob versions prior to v9 are no longer supported
[14:26:17.705] npm warn deprecated @supabase/auth-helpers-shared@0.7.0: This package is now deprecated - please use the @supabase/ssr package instead.
[14:26:18.343] npm warn deprecated @supabase/auth-helpers-nextjs@0.10.0: This package is now deprecated - please use the @supabase/ssr package instead.
[14:26:18.346] npm warn deprecated @humanwhocodes/object-schema@2.0.3: Use @eslint/object-schema instead
[14:26:18.461] npm warn deprecated @humanwhocodes/config-array@0.13.0: Use @eslint/config-array instead
[14:26:20.746] npm warn deprecated eslint@8.57.1: This version is no longer supported. Please see https://eslint.org/version-support for other options.
[14:26:31.905] 
[14:26:31.906] added 542 packages in 19s
[14:26:31.906] 
[14:26:31.906] 160 packages are looking for funding
[14:26:31.906]   run `npm fund` for details
[14:26:31.962] Detected Next.js version: 15.1.0
[14:26:31.963] Running "next build"
[14:26:32.548] Attention: Next.js now collects completely anonymous telemetry regarding usage.
[14:26:32.550] This information is used to shape Next.js' roadmap and prioritize features.
[14:26:32.550] You can learn more, including how to opt-out if you'd not like to participate in this anonymous program, by visiting the following URL:
[14:26:32.550] https://nextjs.org/telemetry
[14:26:32.551] 
[14:26:32.607]    ▲ Next.js 15.1.0
[14:26:32.608] 
[14:26:32.676]    Creating an optimized production build ...
[14:27:00.255]  ✓ Compiled successfully
[14:27:00.261]    Linting and checking validity of types ...
[14:27:10.360] Failed to compile.
[14:27:10.360] 
[14:27:10.361] app/app/organizador/eventos/[id]/page.tsx
[14:27:10.361] Type error: Type 'PageProps' does not satisfy the constraint 'import("/vercel/path0/.next/types/app/app/organizador/eventos/[id]/page").PageProps'.
[14:27:10.361]   Types of property 'params' are incompatible.
[14:27:10.361]     Type '{ id: string; }' is missing the following properties from type 'Promise<any>': then, catch, finally, [Symbol.toStringTag]
[14:27:10.361] 
[14:27:10.410] Error: Command "next build" exited with 1
[14:27:11.064] 



I'm getting this error, I've done everything and it's still giving me the error. Can you help?
