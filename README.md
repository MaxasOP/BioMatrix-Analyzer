# BioMatrix Analyzer

BioMatrix AI is the web evolution of the original DNA Sequence Analyzer. This repository now contains both the modern Next.js platform and the legacy Java Swing desktop app.

## Repository layout
- `web/` - Next.js + Supabase + Gemini bioinformatics platform
- `src/` - Legacy Java Swing analyzer
- `DNA Sample/` - Sample FASTA/text inputs

## Web app (recommended)
```bash
cd web
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Environment variables and Supabase setup are documented in [web/README.md](web/README.md).

## Java app (legacy)
From project root:

### Manual Compile & Run (cmd/PowerShell)
```bash
javac -d out src/dnaanalyzer/*.java src/dnaanalyzer/*/*.java src/dnaanalyzer/*/*/*.java
java -cp out dnaanalyzer.Main
```

### One-liner PowerShell (Windows)
```powershell
New-Item -ItemType Directory -Force out | Out-Null; javac -d out (Get-ChildItem -Recurse -Filter *.java src | ForEach-Object { $_.FullName }); java -cp out dnaanalyzer.Main
```

Launches the Swing GUI for sequence input and analysis.

**Requirements**: JDK 25+

## License
MIT License - feel free to use or modify.

