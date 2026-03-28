import { useEffect, useState } from "react";
import { subscribeNetworkLoading } from "../../api/axios";
import FresaLoader from "./FresaLoader";

const GlobalNetworkLoader = () => {
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeNetworkLoading(setIsLoading);
    return unsubscribe;
  }, []);

  if (!isLoading) return null;

  return (
    <FresaLoader
      title="Un momento..."
      subtitle="Estamos actualizando tu información"
    />
  );
};

export default GlobalNetworkLoader;
