import { Layout } from './components/Layout';

function App() {
  return (
    <Layout>
      <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl text-primary">+</span>
          </div>
          <h2 className="text-xl font-semibold mb-2">Welcome to Ableton Project Manager</h2>
          <p className="text-muted-foreground mb-6">
            Start by adding a folder to scan for your Ableton Live projects.
          </p>
          <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors font-medium">
            Add Folder
          </button>
        </div>
      </div>
    </Layout>
  );
}

export default App;
