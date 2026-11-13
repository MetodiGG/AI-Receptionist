import { BrandLoading } from '../../components/brand-loading'
export default function BusinessSearchLoading() {
  return <main className="loading-screen" aria-busy="true"><div className="loading-box"><BrandLoading size={48} label="Зареждане · Loading…"/></div></main>
}
