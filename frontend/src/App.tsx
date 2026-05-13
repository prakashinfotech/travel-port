import { Provider } from 'react-redux'
import { store } from '@/store'
import { AppRouter } from '@/routes/AppRouter'
import { ToastProvider } from '@/components/ui/ToastProvider'

export default function App() {
  return (
    <Provider store={store}>
      <ToastProvider>
        <AppRouter />
      </ToastProvider>
    </Provider>
  )
}
