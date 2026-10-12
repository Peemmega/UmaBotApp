import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import postcss from 'postcss'

const DESKTOP_MIN_WIDTH = 1024

function mayBeBelowDesktopFontFloor(value) {
  if (/\bvar\(/i.test(value)) return true

  const units = [...value.toLowerCase().matchAll(/(-?(?:\d+\.?\d*|\.\d+))\s*(px|pt|em|rem|vw|vh|vmin|vmax|%|in|cm|mm|pc)/g)]
  return units.some(([, rawAmount, unit]) => {
    const amount = Number(rawAmount)
    if (unit === 'px') return amount > 0 && amount < 14
    if (unit === 'pt') return amount > 0 && amount < 10.5
    if (unit === 'rem') return amount > 0 && amount < 0.875
    if (unit === 'em') return amount > 0 && amount < 1
    if (unit === 'vw') return amount > 0 && amount < (14 / DESKTOP_MIN_WIDTH) * 100
    if (unit === '%') return amount > 0 && amount < 100
    if (unit === 'in') return amount > 0 && amount < (14 / 96)
    if (unit === 'cm') return amount > 0 && amount < (14 / 96) * 2.54
    if (unit === 'mm') return amount > 0 && amount < (14 / 96) * 25.4
    if (unit === 'pc') return amount > 0 && amount < (14 / 16)
    return amount > 0
  })
}

function getRuleAtRules(rule, root) {
  const ancestors = []

  for (let parent = rule.parent; parent && parent !== root; parent = parent.parent) {
    if (parent.type !== 'atrule') continue
    if (/keyframes/i.test(parent.name)) return null

    if (parent.name === 'media') {
      const maxWidth = parent.params.match(/max-width\s*:\s*([\d.]+)px/i)
      if (maxWidth && Number(maxWidth[1]) < DESKTOP_MIN_WIDTH) return null
    }

    ancestors.unshift(parent)
  }

  return ancestors
}

function desktopFontFloor() {
  return {
    postcssPlugin: 'uma-desktop-font-floor',
    OnceExit(root) {
      const rules = []

      root.walkRules((rule) => {
        const fontSizes = rule.nodes?.filter((node) => node.type === 'decl' && node.prop === 'font-size') || []
        if (!fontSizes.length) return

        const ancestors = getRuleAtRules(rule, root)
        if (ancestors === null) return

        const adjustableFontSizes = fontSizes.filter((declaration) => {
          const value = declaration.value.trim()
          return !/^(?:inherit|initial|unset|revert|revert-layer|medium|large|larger)$/i.test(value)
            && !/^0(?:\.0+)?(?:px|pt|em|rem|vw|vh|vmin|vmax|%)?$/i.test(value)
            && mayBeBelowDesktopFontFloor(value)
        })
        if (!adjustableFontSizes.length) return

        rules.push({ rule, ancestors, fontSizes: adjustableFontSizes })
      })

      if (!rules.length) return

      const desktopMedia = postcss.atRule({ name: 'media', params: `(min-width: ${DESKTOP_MIN_WIDTH}px)` })
      root.append(desktopMedia)

      const inheritedTextFloor = postcss.rule({ selector: 'small, button, input, select, textarea' })
      inheritedTextFloor.append(postcss.decl({
        prop: 'font-size',
        value: 'max(14px, 1em)',
        important: true,
      }))
      desktopMedia.append(inheritedTextFloor)

      for (const { rule, ancestors, fontSizes } of rules) {
        let parent = desktopMedia

        for (const ancestor of ancestors) {
          let nested = parent.nodes?.find((node) => node.type === 'atrule'
            && node.name === ancestor.name
            && node.params === ancestor.params)
          if (!nested) {
            nested = postcss.atRule({ name: ancestor.name, params: ancestor.params })
            parent.append(nested)
          }
          parent = nested
        }

        const override = rule.clone({ nodes: [] })
        for (const declaration of fontSizes) {
          override.append(declaration.clone({
            value: `max(14px, ${declaration.value})`,
            important: true,
          }))
        }
        parent.append(override)
      }
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  css: {
    postcss: {
      plugins: [desktopFontFloor()],
    },
  },
})
