let foodItems = []

function createMealPlan(mealPlan) {
  return api(mealPlanEndpoint, {
    method: "POST",
    headers: headers,
    body: JSON.stringify(mealPlan),
  }).then((response) => {
    if (response) {
      return response.json();
    }
  });
}

function fetchMealOptions() {
  return api(allMealsEndpoint, {
    method: "GET",
    headers: headers,
  }).then((res) => (!!res ? res.json() : undefined));
}

function populateMealOptions(meals) {
  const days = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];
  const daysContainer = document.getElementById("days");

  days.forEach((day) => {
    const dayContainer = document.createElement("div");
    dayContainer.innerHTML = `<h3>${day}</h3>`;

    const select = document.createElement("select");
    select.name = day.toLowerCase() + "[]";
    select.multiple = true;

    meals.forEach((meal) => {
      const option = document.createElement("option");
      option.value = meal.id;
      option.text = meal.name;
      select.appendChild(option);
    });

    dayContainer.appendChild(select);
    daysContainer.appendChild(dayContainer);
  });
}

function addMealPlanFormListener() {
  document
    .getElementById("mealPlanForm")
    .addEventListener("submit", function (event) {
      event.preventDefault();

      const formData = new FormData(this);
      const mealPlan = {
        name: formData.get("name"),
        effectiveFrom: formData.get("effectiveFrom"),
        monday: Array.from(formData.getAll("monday[]")).map((id, order) => ({
          id,
          order: order + 1,
        })),
        tuesday: Array.from(formData.getAll("tuesday[]")).map((id, order) => ({
          id,
          order: order + 1,
        })),
        wednesday: Array.from(formData.getAll("wednesday[]")).map(
          (id, order) => ({ id, order: order + 1 })
        ),
        thursday: Array.from(formData.getAll("thursday[]")).map(
          (id, order) => ({ id, order: order + 1 })
        ),
        friday: Array.from(formData.getAll("friday[]")).map((id, order) => ({
          id,
          order: order + 1,
        })),
        saturday: Array.from(formData.getAll("saturday[]")).map(
          (id, order) => ({ id, order: order + 1 })
        ),
        sunday: Array.from(formData.getAll("sunday[]")).map((id, order) => ({
          id,
          order: order + 1,
        })),
      };

      createMealPlan(mealPlan);
    });
}

function init() {
  fetchMealOptions().then((meals) => {
    if (meals) {
      populateMealOptions(meals);
    }
  });

  addMealPlanFormListener();
}

function createFoodItem(foodItem) {
  return api(foodItemEndpoint, {
    method: "POST",
    headers: headers,
    body: JSON.stringify(foodItem),
  }).then((response) => {
    if (response) {
      return response.json();
    }
  });
}

function addFoodItemFormListener() {
  document
    .getElementById("foodItemForm")
    .addEventListener("submit", function (event) {
      event.preventDefault();

      const formData = new FormData(this);

      const foodItem = {
        name: formData.get("name"),
        sources: formData
          .get("sources")
          .split(",")
          .map((s) => s.trim()),
        nutrientSources: formData
          .get("nutrientSources")
          .split(",")
          .map((s) => s.trim()),
        reference: `${formData.get("reference")}`,
        nutrients: {
          nutrients: {
            calories: {
              name: "calories",
              value: `${formData.get("calories")}:UNIT`,
            },
            carbohydrate: {
              name: "carbohydrate",
              value: `${formData.get("carbohydrate")}:g`,
            },
            fat: { name: "fat", value: `${formData.get("fat")}:g` },
            protein: { name: "protein", value: `${formData.get("protein")}:g` },
          },
        },
      };

      createFoodItem(foodItem);
    });
}
function createMeal(meal) {
  return api(mealEndpoint, {
    method: "POST",
    headers: headers,
    body: JSON.stringify(meal),
  }).then((response) => {
    if (response) {
      return response.json();
    }
  });
}

function populateFoodItems(foodItems) {
  const select = document.getElementById("foodSelect");
  foodItems.forEach((item) => {
    const option = document.createElement("option");
    option.value = item.id;
    option.textContent = item.name;
    select.appendChild(option);
  });
}

function updateFoodItemDetails(foodItem) {
  const container = document.getElementById("foodItemDetails");
  container.innerHTML = "";

  if (foodItem) {
    const itemDiv = document.createElement("div");
    itemDiv.classList.add("food-item");

    const nameLabel = document.createElement("label");
    nameLabel.textContent = foodItem.name;
    itemDiv.appendChild(nameLabel);

    const amountInput = document.createElement("input");
    amountInput.type = "number";
    amountInput.value = 100; // Default amount
    amountInput.min = 0;
    amountInput.step = 1;
    amountInput.id = `amount-${foodItem.id}`;
    amountInput.dataset.id = foodItem.id;
    amountInput.style.marginRight = "10px";
    itemDiv.appendChild(amountInput);

    const amountSlider = document.createElement("input");
    amountSlider.type = "range";
    amountSlider.value = 100; // Default amount
    amountSlider.min = 0;
    amountSlider.max = 1000; // Max value
    amountSlider.step = 1;
    amountSlider.id = `slider-${foodItem.id}`;
    amountSlider.dataset.id = foodItem.id;
    itemDiv.appendChild(amountSlider);

    const nutrientInfo = document.createElement("div");
    nutrientInfo.id = `nutrient-info-${foodItem.id}`;
    itemDiv.appendChild(nutrientInfo);

    container.appendChild(itemDiv);

    // Event listeners
    amountInput.addEventListener("input", updateNutrientInfo);
    amountSlider.addEventListener("input", updateNutrientInfo);

    function updateNutrientInfo() {
      const amount = amountInput.value;
      const sliderValue = amountSlider.value;

      // Update the input field with the slider value
      if (amount !== sliderValue) {
        amountInput.value = sliderValue;
      }

      const originalReference = foodItem.reference;
      const nutrients = foodItem.nutrients.nutrients;
      const updatedNutrients = {
        calories: nutrientValueCalculation(nutrients.CALORIES, sliderValue, originalReference),
        carbohydrate: nutrientValueCalculation(nutrients.CARBOHYDRATE, sliderValue, originalReference),
        fat: nutrientValueCalculation(nutrients.FAT, sliderValue, originalReference),
        protein: nutrientValueCalculation(nutrients.PROTEIN, sliderValue, originalReference)
    };

    const nutrientText = `
        Calories: ${updatedNutrients.calories.amount} ${updatedNutrients.calories.value.unit}
        Carbohydrate: ${updatedNutrients.carbohydrate.amount} ${updatedNutrients.carbohydrate.value.unit}
        Fat: ${updatedNutrients.fat.amount} ${updatedNutrients.fat.value.unit}
        Protein: ${updatedNutrients.protein.amount} ${updatedNutrients.protein.value.unit}
    `;
      document.getElementById(`nutrient-info-${foodItem.id}`).textContent =
        nutrientText;
    }
  }
}

function nutrientValueCalculation(nutrient, referenceValue, originalReference) {
  function convertToBaseUnit(amount, unit) {
    switch (unit) {
      case "ΜG":
        return amount / 1e6; // µg to g
      case "MG":
        return amount / 1e3; // mg to g
      default:
        return amount;
    }
  }

  const nutrientAmount = parseFloat(nutrient.value.amount);
  const nutrientUnit = nutrient.value.unit;
  const referenceAmount = parseFloat(referenceValue);
  const originalReferenceAmount = parseFloat(originalReference.amount);
  const originalReferenceUnit = originalReference.unit;

  const baseNutrientAmount = convertToBaseUnit(nutrientAmount, nutrientUnit);
  const baseOriginalReferenceAmount = convertToBaseUnit(
    originalReferenceAmount,
    originalReferenceUnit
  );
  const baseReferenceAmount = convertToBaseUnit(
    referenceAmount,
    originalReferenceUnit
  );

  const adjustedAmount = (
    (baseNutrientAmount * baseReferenceAmount) /
    baseOriginalReferenceAmount
  ).toFixed(2);

  return {
    ...nutrient,
    amount: adjustedAmount, 
  };
}

function addMealFormListener() {
  document
    .getElementById("mealForm")
    .addEventListener("submit", function (event) {
      event.preventDefault();

      const formData = new FormData(this);
      const components = [];

      // Collect components
      document.querySelectorAll(".food-item").forEach((itemDiv) => {
        const amountInput = itemDiv.querySelector('input[type="number"]');
        if (amountInput && amountInput.value > 0) {
          components.push({
            id: amountInput.dataset.id,
            amount: `${amountInput.value}:g`,
          });
        }
      });

      const meal = {
        name: formData.get("name"),
        components: components,
      };

      createMeal(meal);
    });
}

function addFoodItemOptions() {
  api(foodItemEndpoint, { method: "GET", headers: headers })
    .then((res) => (!!res ? res.json() : undefined))
    .then((foodItems) => {
      populateFoodItems(foodItems);

      document
        .getElementById("foodSelect")
        .addEventListener("change", function () {
          const selectedId = this.value;
          if (selectedId) {
            const selectedItem = foodItems.find(
              (item) => item.id === selectedId
            );
            updateFoodItemDetails(selectedItem);
          }
        });
    });

  addMealFormListener();
}

window.addEventListener("load", addFoodItemOptions);
window.addEventListener("load", addFoodItemFormListener);
window.addEventListener("load", init);
