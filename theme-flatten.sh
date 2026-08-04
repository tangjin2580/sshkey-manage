#!/bin/bash
find src -type f -name "*.tsx" -o -name "*.ts" | xargs sed -i \
  -e 's/bg-gradient-to-[a-z]* from-[a-z]*-[0-9]* to-[a-z]*-[0-9]*/bg-blue-600/g' \
  -e 's/shadow-lg shadow-sm/shadow-sm/g' \
  -e 's/shadow-xl shadow-sm/shadow-sm/g' \
  -e 's/shadow-md shadow-sm/shadow-sm/g' \
  -e 's/shadow-lg//g' \
  -e 's/shadow-md//g' \
  -e 's/shadow-xl//g' \
  -e 's/shadow-2xl//g' \
  -e 's/border-zinc-800/border-white\/10/g' \
  -e 's/bg-zinc-950/bg-[#000000]/g' \
  -e 's/bg-zinc-900/bg-[#0a0a0a]/g' \
  -e 's/bg-zinc-800/bg-[#141414]/g' \
  -e 's/rounded-lg/rounded-md/g' \
  -e 's/rounded-xl/rounded-md/g' \
  -e 's/rounded-2xl/rounded-md/g' \
  -e 's/ring-2 ring-blue-500\/50/ring-1 ring-blue-500/g' \
  -e 's/ring-[0-9]* ring-zinc-[0-9]*\/[0-9]*//g'

