# ATTRIBUTION — Spell UI (vendored)

The components in this directory (`badge`, `blur-reveal`, `copy-button`,
`gradient-wave-text`, `rich-button`, `spinner`, `tilt-card`) are adapted from
**Spell UI** and are used under its MIT license.

> MIT License
>
> Copyright (c) 2025 Spell UI
>
> Permission is hereby granted, free of charge, to any person obtaining a copy
> of this software and associated documentation files (the "Software"), to deal
> in the Software without restriction, including without limitation the rights
> to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
> copies of the Software, and to permit persons to whom the Software is
> furnished to do so, subject to the following conditions:
>
> The above copyright notice and this permission notice shall be included in all
> copies or substantial portions of the Software.
>
> THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
> IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
> FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
> AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
> LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
> OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
> SOFTWARE.

Source: https://github.com/xxtomm/spell-ui

Local adaptations (vs upstream): `"use client"` removed, `@/lib/utils`
remapped to `@/lib/cn`, `<style jsx>` converted to plain `<style>`, no
`next-themes` dependency, `gradient-wave-text` pauses its rAF loop under
`prefers-reduced-motion` by default.
