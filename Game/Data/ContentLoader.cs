using System.Collections.Generic;
using System.IO;
using Newtonsoft.Json;

namespace FarmToStars.Data
{
    /// <summary>
    /// Loads content JSON files.
    /// </summary>
    public static class ContentLoader
    {
        /// <summary>
        /// Loads all resources from JSON file.
        /// </summary>
        public static List<Resource> LoadResources(string path)
        {
            if (!File.Exists(path))
                return new List<Resource>();

            var json = File.ReadAllText(path);
            return JsonConvert.DeserializeObject<List<Resource>>(json) ?? new List<Resource>();
        }

        /// <summary>
        /// Loads all buildings from JSON file.
        /// </summary>
        public static List<Building> LoadBuildings(string path)
        {
            if (!File.Exists(path))
                return new List<Building>();

            var json = File.ReadAllText(path);
            return JsonConvert.DeserializeObject<List<Building>>(json) ?? new List<Building>();
        }
    }
}

