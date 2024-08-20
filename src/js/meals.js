let foodItems = [];

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

function addMealOptions() {
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

function populateFoodItems(foodItems) {
  const select = document.getElementById("foodSelect");
  foodItems.forEach((item) => {
    const option = document.createElement("option");
    option.value = item.id;
    option.textContent = item.name;
    select.appendChild(option);
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

function addFoodItemOptions() {
  api(foodItemEndpoint, { method: "GET", headers: headers })
    .then((res) => (!!res ? res.json() : undefined))
    .then((fetchedFoodItems) => {
      foodItems = fetchedFoodItems;
      populateFoodItems(foodItems);

      document
        .getElementById("addFoodItem")
        .addEventListener("click", addFoodItem);
    });

  addMealFormListener();
}

function updateNutrientInfoAndTotals() {
  const totals = {
    calories: 0,
    carbohydrate: 0,
    fat: 0,
    protein: 0,
  };

  document.querySelectorAll(".food-item").forEach((itemDiv, index) => {
    const selectElement = document.getElementById(`foodItemSelect-${index}`);
    const sliderElement = document.getElementById(`foodItemSlider-${index}`);
    const sliderValue = parseFloat(sliderElement.value);
    const selectedFoodId = selectElement.value;
    const foodItem = foodItems.find((item) => item.id === selectedFoodId);

    if (foodItem) {
      const updatedNutrients = {
        calories: nutrientValueCalculation(
          foodItem.nutrients.nutrients.CALORIES,
          sliderValue,
          foodItem.nutrients.nutrients.CALORIES
        ),
        carbohydrate: nutrientValueCalculation(
          foodItem.nutrients.nutrients.CARBOHYDRATE,
          sliderValue,
          foodItem.nutrients.nutrients.CARBOHYDRATE
        ),
        fat: nutrientValueCalculation(
          foodItem.nutrients.nutrients.FAT,
          sliderValue,
          foodItem.nutrients.nutrients.FAT
        ),
        protein: nutrientValueCalculation(
          foodItem.nutrients.nutrients.PROTEIN,
          sliderValue,
          foodItem.nutrients.nutrients.PROTEIN
        ),
      };

      totals.calories += parseFloat(updatedNutrients.calories.amount);
      totals.carbohydrate += parseFloat(updatedNutrients.carbohydrate.amount);
      totals.fat += parseFloat(updatedNutrients.fat.amount);
      totals.protein += parseFloat(updatedNutrients.protein.amount);

      document.getElementById(
        `nutrient-info-${index}`
      ).textContent = `Calories: ${updatedNutrients.calories.amount} ${updatedNutrients.calories.value.unit}
                Carbohydrate: ${updatedNutrients.carbohydrate.amount} ${updatedNutrients.carbohydrate.value.unit}
                Fat: ${updatedNutrients.fat.amount} ${updatedNutrients.fat.value.unit}
                Protein: ${updatedNutrients.protein.amount} ${updatedNutrients.protein.value.unit}`;
    }
  });

  document.getElementById("totals").innerHTML = `
        Total Calories: ${totals.calories.toFixed(2)} UNIT
        Total Carbohydrate: ${totals.carbohydrate.toFixed(2)} g
        Total Fat: ${totals.fat.toFixed(2)} g
        Total Protein: ${totals.protein.toFixed(2)} g
    `;
}

function nutrientValueCalculation(nutrient, referenceValue, originalReference) {
    function convertToBaseUnit(amount, unit) {
        switch (unit) {
            case 'µg': return amount / 1e6; // µg to g
            case 'mg': return amount / 1e3; // mg to g
            default: return amount
        }
    }

    const nutrientAmount = parseFloat(nutrient.value.amount);
    const nutrientUnit = nutrient.unit;
    const referenceAmount = parseFloat(referenceValue);
    const originalReferenceAmount = parseFloat(originalReference.value.amount);
    const originalReferenceUnit = originalReference.value.unit;

    const baseNutrientAmount = convertToBaseUnit(nutrientAmount, nutrientUnit);
    const baseOriginalReferenceAmount = convertToBaseUnit(originalReferenceAmount, originalReferenceUnit);
    const baseReferenceAmount = convertToBaseUnit(referenceAmount, originalReferenceUnit);

    const adjustedAmount = (baseNutrientAmount * baseReferenceAmount / baseOriginalReferenceAmount).toFixed(2);

    return {
        ...nutrient,
        amount: adjustedAmount
    };
}

function handleSliderChange(event) {
  updateNutrientInfoAndTotals();
}

function addFoodItem() {
  const container = document.getElementById("foodItemsContainer");
  const index = container.children.length;

  const itemDiv = document.createElement("div");
  itemDiv.classList.add("food-item");
  itemDiv.dataset.index = index;

  const selectElement = document.createElement("select");
  selectElement.id = `foodItemSelect-${index}`;
  selectElement.name = `foodItem-${index}`;

  foodItems.forEach((item) => {
    const option = document.createElement("option");
    option.value = item.id;
    option.textContent = item.name;
    selectElement.appendChild(option);
  });

  const sliderElement = document.createElement("input");
  sliderElement.type = "range";
  sliderElement.id = `foodItemSlider-${index}`;
  sliderElement.min = "0";
  sliderElement.max = "500";
  sliderElement.value = "100";

  const sliderValueElement = document.createElement("span");
  sliderValueElement.id = `foodItemValue-${index}`;
  sliderValueElement.textContent = "100";
  sliderValueElement.style.display = "none";

  const nutrientInfoElement = document.createElement("div");
  nutrientInfoElement.id = `nutrient-info-${index}`;

  const foodSelect = document.getElementById('foodSelect');

  // Unselect the selected option
  foodSelect.selectedIndex = -1;


  selectElement.addEventListener("change", function () {
    sliderElement.style.display = "block";
    sliderValueElement.style.display = "inline"; // Show slider when item is selected
    handleSliderChange();
  });

  sliderElement.addEventListener("input", function () {
    sliderValueElement.textContent = sliderElement.value;
    handleSliderChange();
  });

  itemDiv.appendChild(selectElement);
  itemDiv.appendChild(sliderElement);
  itemDiv.appendChild(sliderValueElement);
  itemDiv.appendChild(nutrientInfoElement);

  container.appendChild(itemDiv);

  updateNutrientInfoAndTotals();
}

function addMealFormListener() {
  document
    .getElementById("mealForm")
    .addEventListener("submit", function (event) {
      event.preventDefault();

      const formData = new FormData(this);
      const components = [];

      formData.getAll("components[]").forEach((amount, index) => {
        const foodItemId = document.querySelector(`#amount-${index}`).dataset
          .id;
        if (amount) {
          components.push({
            id: foodItemId,
            amount: amount,
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

function createMeal(meal) {
    return api(mealEndpoint, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(meal)
    })
    .then(response => {
        if (response) {
            return response.json();
        }
    });
}

window.addEventListener("load", addFoodItemOptions);
window.addEventListener("load", addFoodItemFormListener);
window.addEventListener("load", addMealOptions);
