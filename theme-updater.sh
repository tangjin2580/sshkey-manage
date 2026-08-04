#!/bin/bash
find src -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i \
  -e 's/slate-/zinc-/g' \
  -e 's/emerald-/blue-/g' \
  -e 's/shadow-emerald-[0-9]*\/[0-9]*/shadow-sm/g' \
  -e 's/shadow-blue-[0-9]*\/[0-9]*/shadow-sm/g' \
  -e 's/rounded-2xl/rounded-xl/g' \
  -e 's/rounded-xl/rounded-lg/g' \
  -e 's/bg-zinc-950\/80/bg-zinc-950/g' \
  -e 's/backdrop-blur-md//g' \
  -e 's/backdrop-blur-sm//g'
