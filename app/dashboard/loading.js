import { BrandLoading } from '../../components/brand-loading'
export default function DashboardLoading() {
  return <div className="admin-loading" aria-busy="true"><BrandLoading size={40} label="Зареждане · Loading…"/></div>
}
