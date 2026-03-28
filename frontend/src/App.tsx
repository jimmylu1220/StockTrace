import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import TaiwanStocks from './pages/TaiwanStocks'
import USStocks from './pages/USStocks'
import PotentialStocks from './pages/PotentialStocks'
import SignalAnalysis from './pages/SignalAnalysis'
import IndustryLandscape from './pages/IndustryLandscape'
import News from './pages/News'
import Education from './pages/Education'
import EducationDetail from './pages/EducationDetail'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="tw-stocks" element={<TaiwanStocks />} />
          <Route path="industry" element={<IndustryLandscape />} />
          <Route path="us-stocks" element={<USStocks />} />
          <Route path="potential" element={<PotentialStocks />} />
          <Route path="signals" element={<SignalAnalysis />} />
          <Route path="news" element={<News />} />
          <Route path="education" element={<Education />} />
          <Route path="education/:id" element={<EducationDetail />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
