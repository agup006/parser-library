import { Provider } from 'react-redux';
import { store } from './store';
import ParserTester from './pages/ParserTester';

function App() {
  return (
    <Provider store={store}>
      <ParserTester />
    </Provider>
  );
}

export default App;
