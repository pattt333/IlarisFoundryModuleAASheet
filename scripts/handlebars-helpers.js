/**
 * Handlebars Helper Registration
 * 
 * This module registers all custom Handlebars helpers used in the
 * Ilaris Alternative Actor Sheet templates.
 */

/**
 * Register all Handlebars helpers
 * Should be called during module initialization
 */
export function registerHandlebarsHelpers() {
  // Range helper - creates array of n elements
  Handlebars.registerHelper('range', function(n) {
    const result = [];
    for (let i = 0; i < n; i++) {
      result.push(i);
    }
    return result;
  });

  // Check if actor is a caster (Zauberer or Geweihter)
  Handlebars.registerHelper('isCaster', function (actor) {
    return (
      actor.system.abgeleitete.zauberer || actor.system.abgeleitete.geweihter
    )
  });
  
  // Mathematical operations
  Handlebars.registerHelper('add', function(a, b) {
    return (a || 0) + (b || 0);
  });
  
  Handlebars.registerHelper('subtract', function(a, b) {
    return (a || 0) - (b || 0);
  });
  
  Handlebars.registerHelper('gte', function(a, b) {
    return (a || 0) >= (b || 0);
  });
  
  Handlebars.registerHelper('divide', function(a, b) {
    if (!b || b === 0) return 0;
    return (a || 0) / b;
  });
  
  Handlebars.registerHelper('multiply', function(a, b) {
    return (a || 0) * (b || 0);
  });
  
  Handlebars.registerHelper('percentage', function(current, max) {
    if (!max || max === 0) return 0;
    return Math.round(((current || 0) / max) * 100);
  });
  
  // Array and string operations
  Handlebars.registerHelper('join', function(array, separator) {
    if (!array || !Array.isArray(array)) return '';
    return array.join(separator || ', ');
  });

  // Eigenschaften helper - handles both array and object formats
  Handlebars.registerHelper('eigenschaften', function(eigenschaften, separator = ', ') {
    if (!eigenschaften) return '';
    
    // Handle array format: [{key: "name", parameters: ["param1", "param2"]}, ...]
    if (Array.isArray(eigenschaften)) {
      return eigenschaften.map(e => {
        if (!e || !e.key) return '';
        
        // If parameters exist and array is not empty, add them in parentheses separated by semicolons
        if (e.parameters && Array.isArray(e.parameters) && e.parameters.length > 0) {
          return `${e.key}(${e.parameters.join(';')})`;
        }
        
        return e.key;
      }).filter(s => s).join(separator || ', ');
    }
    
    // Handle object format: {property1: true, property2: false, ...}
    if (typeof eigenschaften === 'object') {
      const trueProperties = Object.keys(eigenschaften).filter(key => eigenschaften[key] === true);
      return trueProperties.join(separator || ', ');
    }
    
    return '';
  });

  // Helper for creating arrays in templates
  Handlebars.registerHelper('array', function() {
    return Array.from(arguments).slice(0, -1); // Remove the Handlebars options object
  });

  // Helper for concatenating strings
  Handlebars.registerHelper('concat', function() {
    return Array.from(arguments).slice(0, -1).join(''); // Remove the Handlebars options object
  });

  // Helper for creating hash objects
  Handlebars.registerHelper('hash', function() {
    const options = arguments[arguments.length - 1];
    return options.hash;
  });

  // Helper for checking if any item in an array has a truthy property
  Handlebars.registerHelper('some', function(array, property) {
    if (!Array.isArray(array)) return false;
    return array.some(item => {
      // Handle nested properties like "system.hauptwaffe"
      const props = property.split('.');
      let value = item;
      for (const prop of props) {
        value = value?.[prop];
        if (value === undefined) return false;
      }
      return !!value;
    });
  });

  // Helper for extracting names from an array of items
  Handlebars.registerHelper('itemNames', function(items) {
    if (!Array.isArray(items)) return '';
    return items.map(item => item?.name || '').filter(name => name).join(', ');
  });

  // String transformations
  Handlebars.registerHelper('capitalize', function(str) {
    if (!str || typeof str !== 'string') return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  });

  Handlebars.registerHelper('uppercase', function(str) {
    if (!str || typeof str !== 'string') return '';
    return str.toUpperCase();
  });

  // Color modifier helper for health status
  Handlebars.registerHelper('modColor', function(value) {
    if (value > 0) return 'positive';
    if (value < 0) return 'negative';
    return 'neutral';
  });

  // Comparison helpers
  Handlebars.registerHelper('includes', function(array, value) {
    if (!array || !Array.isArray(array)) return false;
    return array.includes(value);
  });

  Handlebars.registerHelper('stringIncludes', function(str, search) {
    if (!str || typeof str !== 'string') return false;
    return str.includes(search);
  });

  Handlebars.registerHelper('eq', function(a, b) {
    return a === b;
  });

  // Health segments helper - creates LAW-based health segments with colors
  Handlebars.registerHelper('healthSegments', function(actor) {
    const hp = actor?.system?.gesundheit?.hp || {};
    const currentHP = hp.value ?? 0;
    const maxHP = hp.max ?? 0;
    const law = actor?.system?.abgeleitete?.law ?? Math.ceil(maxHP / 8);

    if (!maxHP || !law) return [];

    const segments = [];
    
    // Create 7 segments (Segments 1-6 individual, Segment 7 = rest up to maxHP)
    for (let i = 1; i <= 7; i++) {
      const isLastSegment = i === 7;
      const segmentStart = (i - 1) * law + 1;
      const segmentSize = isLastSegment ? maxHP - (6 * law) : law; // Last segment: remaining HP to max
      const segmentEnd = isLastSegment ? maxHP : segmentStart + segmentSize - 1;
      
      // Determine color: 1-4 = red, 5-6 = yellow, 7 = green
      let color = 'red';
      if (i >= 5 && i <= 6) color = 'yellow';
      if (i === 7) color = 'green';
      
      // Calculate fill percentage for this segment
      let fillPercentage = 0;
      if (currentHP >= segmentEnd) {
        // Segment is completely filled
        fillPercentage = 100;
      } else if (currentHP >= segmentStart) {
        // Segment is partially filled
        const hpInSegment = currentHP - segmentStart + 1;
        fillPercentage = Math.max(0, Math.min(100, (hpInSegment / segmentSize) * 100));
      }
      // else: currentHP < segmentStart, segment is empty (fillPercentage = 0)
      
      segments.push({
        number: i,
        start: segmentStart,
        end: segmentEnd,
        size: segmentSize,
        color: color,
        fillPercentage: Math.round(fillPercentage),
        width: (segmentSize / maxHP) * 100 // Width proportional to segment size
      });
    }
    
    return segments;
  });

  console.log('Ilaris Alternative Actor Sheet | Handlebars helpers registered');
}
