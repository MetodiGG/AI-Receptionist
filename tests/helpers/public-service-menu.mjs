// Execute the real shared menu in offline SWC/SSR tests. Only CSS-module
// class names and explicitly injected visual children may be stubbed.
import { readFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { createElement } from 'react'
const runtimeRequire = createRequire(new URL('../../components/public-service-menu.js', import.meta.url))
const swcRequire = createRequire(import.meta.url)
const { loadBindings, transform } = swcRequire('next/dist/build/swc')
await loadBindings()

async function compile(path, imports = {}) {
  const { code } = await transform(await readFile(new URL('../../' + path, import.meta.url), 'utf8'), {
    filename: path, jsc: { parser: { syntax: 'ecmascript', jsx: true }, transform: { react: { runtime: 'automatic' } } }, module: { type: 'commonjs' },
  })
  const module = { exports: {} }
  new Function('require', 'module', 'exports', code)(name => Object.hasOwn(imports, name) ? imports[name] : runtimeRequire(name), module, module.exports)
  return module.exports
}

export async function loadPublicServiceMenu({ PreparedServiceThumbnail, ServiceThumbnail, Icon } = {}) {
  const css = await readFile(new URL('../../components/public-service-menu.module.css', import.meta.url), 'utf8')
  const styles = Object.freeze(Object.fromEntries([...css.matchAll(/\.([a-zA-Z][\w-]*)/g)].map(match => [match[1], 'public-service-menu-' + match[1]])))
  const thumbnail = PreparedServiceThumbnail ? { PreparedServiceThumbnail }
    : ServiceThumbnail ? { PreparedServiceThumbnail: ({ candidates, ...props }) => createElement(ServiceThumbnail, { ...props, service: candidates?.[0]?.fixtureService }) }
    : await compile('components/prepared-service-thumbnail.js')
  const icon = Icon ? { Icon } : await compile('components/icon.js')
  const { PublicServiceMenu } = await compile('components/public-service-menu.js', {
    './prepared-service-thumbnail': thumbnail, './icon': icon, './public-service-menu.module.css': styles,
  })
  if (!ServiceThumbnail) return { PublicServiceMenu }
  // Existing text/price surface fixtures can inject their known visual stub
  // while keeping catalogue resolution entirely out of the menu under test.
  return {
    PublicServiceMenu: ({ services, photoCandidates = services.map(fixtureService => [{ fixtureService }]), ...props }) =>
      createElement(PublicServiceMenu, { ...props, services, photoCandidates }),
  }
}
