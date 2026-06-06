import { Routes, Route, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import useAppStore from './store/appStore'

import Navbar from './components/ui/Navbar'
import Landing from './pages/Landing'
import Dashboard from './pages/Dashboard'
import ParcelaView from './pages/ParcelaView'
import FinancialPanel from './pages/FinancialPanel'
import Herramientas from './pages/Herramientas'
import Education from './pages/Education'
import Methodology from './pages/Methodology'
import MercadoAgro from './pages/MercadoAgro'
import RedAgricola from './pages/RedAgricola'
import AgentChat from './components/agent/AgentChat'

export default function App() {
  const location = useLocation()
  const showAgent = useAppStore((s) => s.showAgent)
  const setMobile = useAppStore((s) => s.setMobile)
  const isLanding = location.pathname === '/'

  useEffect(() => {
    const handleResize = () => setMobile(window.innerWidth < 768)
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [setMobile])

  return (
    <>
      {!isLanding && <Navbar />}
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/parcela" element={<ParcelaView />} />
        <Route path="/financiero" element={<FinancialPanel />} />
        <Route path="/herramientas" element={<Herramientas />} />
        <Route path="/educacion" element={<Education />} />
        <Route path="/metodologia" element={<Methodology />} />
        <Route path="/mercado" element={<MercadoAgro />} />
        <Route path="/comunidad" element={<RedAgricola />} />
      </Routes>
      {!isLanding && showAgent && <AgentChat />}
    </>
  )
}

