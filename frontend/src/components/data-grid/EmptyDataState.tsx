import { motion } from "framer-motion";
import { ArrowLeft, Container, Terminal, Code, Hexagon } from "lucide-react";

const EmptyDataState = () => {
  const installOptions = [
    {
      name: "Docker",
      icon: Container,
      emoji: "🐳",
      url: "https://docs.datakit.page/docs/installation/docker"
    },
    {
      name: "Homebrew", 
      icon: Terminal,
      emoji: "🍺",
      url: "https://docs.datakit.page/docs/installation/brew"
    },
    {
      name: "Python",
      icon: Code,
      emoji: "🐍", 
      url: "https://docs.datakit.page/docs/installation/pip"
    },
    {
      name: "Node.js",
      icon: Hexagon,
      emoji: "⬢",
      url: "https://docs.datakit.page/docs/installation/npm"
    }
  ];

  return (
    <div className="h-full flex items-center justify-center p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center max-w-lg"
      >
        {/* Main heading */}
        <h1 className="text-2xl font-heading font-semibold text-white mb-3">
          Get started with DataKit
        </h1>

        {/* Description */}
        <p className="text-white/70 mb-6 leading-relaxed">
          Import your files from the sidebar to start analyzing your data.
          <br />
          <motion.span
            className="relative overflow-hidden"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            <motion.span
              className="bg-gradient-to-r from-primary via-blue-400 to-primary bg-clip-text text-transparent bg-[length:200%_100%]"
              animate={{
                backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "linear",
              }}
            >
              Your data stays private
            </motion.span>
          </motion.span>{" "}
          — everything runs locally in your browser.
        </p>

        {/* Import instruction */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex items-center justify-center text-primary text-sm mb-8"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          <span>Use the import options in the sidebar</span>
        </motion.div>

        {/* Self-hosting section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="border-t border-white/10 pt-6"
        >
          <p className="text-white/50 text-sm mb-4">Self-host DataKit:</p>
          
          <div className="flex items-center justify-center gap-3">
            {installOptions.map((option, index) => {
              const IconComponent = option.icon;
              
              return (
                <motion.a
                  key={option.name}
                  href={option.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + index * 0.1, duration: 0.4 }}
                  className="group relative w-10 h-10 rounded-full bg-white/5 hover:bg-primary/10 border border-white/10 hover:border-primary/30 flex items-center justify-center transition-all duration-200 hover:scale-105"
                  title={option.name}
                >
                  {/* Fallback to emoji on small screens or if icon fails */}
                  <span className="text-lg sm:hidden">{option.emoji}</span>
                  <IconComponent className="h-4 w-4 text-primary hidden sm:block" />
                  
                  {/* Tooltip */}
                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
                    {option.name}
                  </div>
                </motion.a>
              );
            })}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default EmptyDataState;