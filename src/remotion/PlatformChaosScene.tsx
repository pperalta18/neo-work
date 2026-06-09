/**
 * PlatformChaosScene — acto 1 de la mini-película E-Commerce (el problema).
 * ──────────────────────────────────────────────────────────────────────────
 * "Tengo una tienda física y quiero vender online… pero elegir e implementar
 * una plataforma es un LÍO lento y caro". Un wrapper fino sobre {@link ChaosScene}
 * con el enjambre propio del e-commerce: nombres de plataformas reales (Shopify,
 * WooCommerce, PrestaShop, Magento…) mezclados con su ruido técnico (plugins,
 * themes, extensiones, hosting…) y etiquetas de fricción.
 */

import { ChaosScene, chaosDuration, type ChaosItem } from './ChaosScene'

const ITEMS: ChaosItem[] = [
  { label: 'Shopify', kind: 'platform', tag: 'comisiones' },
  { label: 'WooCommerce', kind: 'platform' },
  { label: 'PrestaShop', kind: 'platform', tag: '6 semanas' },
  { label: 'Magento', kind: 'platform', tag: 'técnico' },
  { label: 'BigCommerce', kind: 'platform' },
  { label: 'Wix', kind: 'platform' },
  { label: 'Squarespace', kind: 'platform' },
  { label: 'plugins', kind: 'friction' },
  { label: 'themes', kind: 'friction' },
  { label: 'extensiones', kind: 'friction' },
  { label: 'hosting', kind: 'friction' },
  { label: 'pasarela de pago', kind: 'friction', tag: '€€€' },
  { label: 'certificado SSL', kind: 'friction' },
  { label: 'mantenimiento', kind: 'friction' },
]

export const PLATFORM_CHAOS_DURATION = chaosDuration(ITEMS.length)

export function PlatformChaosScene() {
  return (
    <ChaosScene
      centerIcon="store"
      centerTitle="Tu tienda"
      centerSubtitle="quiere vender online"
      items={ITEMS}
    />
  )
}
