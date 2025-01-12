# Version Control and Deployment Guide

## Version Numbering
We use Semantic Versioning (SemVer) with a beta suffix:
- Format: `MAJOR.MINOR.PATCH-beta`
- Example: `0.8.4-beta`

### When to increment:
- **PATCH** (0.8.3 → 0.8.4): Bug fixes and minor changes
- **MINOR** (0.8.4 → 0.9.0): New features, backwards-compatible
- **MAJOR** (0.8.4 → 1.0.0): Breaking changes

## Release Process

1. **Update Version Numbers**:
   ```bash
   # Update in package.json
   "version": "X.X.X-beta"
   
   # Update in index.html meta tag
   <meta name="version" content="X.X.X-beta" />
   ```

2. **Commit Changes**:
   ```bash
   git add .
   git commit -m "vX.X.X-beta: Description of changes"
   ```

3. **Create Version Tag**:
   ```bash
   git tag -a vX.X.X-beta -m "Version X.X.X-beta: Detailed description"
   ```

4. **Push Changes**:
   ```bash
   git push origin main
   git push origin vX.X.X-beta
   ```

5. **Deploy**:
   ```bash
   npm run deploy
   ```

## Rolling Back to Previous Version

1. **List Available Versions**:
   ```bash
   git tag -l
   ```

2. **Checkout Specific Version**:
   ```bash
   git checkout vX.X.X-beta
   ```

3. **Deploy That Version**:
   ```bash
   npm run deploy
   ```

4. **Return to Main Branch**:
   ```bash
   git checkout main
   ```

## Version History

### Current Version
- v0.8.4-beta
  - Fixed text alignment in saved games list
  - Maintained Load/Delete button order

### Previous Versions
- v0.8.3-beta (reverted)
  - Changed button ordering
  - Introduced unintended text alignment issues
- v0.8.2-beta
  - Improved save/load workflow with separate Save and Load actions
- v0.8.1-beta
  - Initial version 