const Home = () => {
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-4xl font-bold text-gray-900 mb-8">Welcome to Parser Library</h1>
      <div className="bg-white rounded-lg shadow-md p-6">
        <p className="text-gray-600 mb-4">
          This is a modern React application framework built with:
        </p>
        <ul className="list-disc list-inside text-gray-600 space-y-2">
          <li>React with TypeScript</li>
          <li>Redux Toolkit for state management</li>
          <li>React Router for navigation</li>
          <li>Tailwind CSS for styling</li>
          <li>Headless UI for accessible components</li>
        </ul>
      </div>
    </div>
  );
};

export default Home; 