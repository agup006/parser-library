const About = () => {
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-4xl font-bold text-gray-900 mb-8">About Parser Library</h1>
      <div className="bg-white rounded-lg shadow-md p-6">
        <p className="text-gray-600 mb-4">
          This project is designed to provide a robust foundation for building modern web applications.
          It includes all the essential tools and configurations needed to get started quickly.
        </p>
        <h2 className="text-2xl font-semibold text-gray-800 mt-6 mb-4">Features</h2>
        <ul className="list-disc list-inside text-gray-600 space-y-2">
          <li>Type-safe development with TypeScript</li>
          <li>Efficient state management with Redux Toolkit</li>
          <li>Modern UI components with Tailwind CSS</li>
          <li>Accessible components with Headless UI</li>
          <li>Fast development with Vite</li>
        </ul>
      </div>
    </div>
  );
};

export default About; 