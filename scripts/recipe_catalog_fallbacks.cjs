// Standard ingredients and steps generator for common Vietnamese culinary dishes and baby weaning meals
function generateDishDetails(title, category, tags = []) {
  const t = title.toLowerCase();

  // 1. CANH DISHES
  if (t.includes('canh đậu hũ cà chua')) {
    return {
      ingredients: [
        { name: 'Đậu hũ non (hoặc đậu hũ trắng)', quantity: 2, unit: 'miếng' },
        { name: 'Thịt heo xay', quantity: 150, unit: 'g' },
        { name: 'Cà chua', quantity: 2, unit: 'quả' },
        { name: 'Hành lá, ngò rí', quantity: 1, unit: 'ít' },
        { name: 'Hành tím băm', quantity: 1, unit: 'củ' },
        { name: 'Gia vị: Nước mắm, hạt nêm, tiêu xay', quantity: 1, unit: 'ít' }
      ],
      steps: [
        { instruction: 'Đậu hũ cắt miếng vuông vừa ăn. Cà chua rửa sạch bổ múi cau. Hành lá, ngò rí rửa sạch thái nhỏ.' },
        { instruction: 'Thịt heo xay ướp với chút hạt nêm, tiêu xay và hành tím băm trong 10 phút.' },
        { instruction: 'Phi thơm hành tím, cho cà chua vào xào mềm tạo màu đẹp. Trút thịt băm vào xào săn.' },
        { instruction: 'Đổ khoảng 700ml nước vào đun sôi, vớt bọt. Nhẹ nhàng cho đậu hũ vào, nêm nếm nước mắm và hạt nêm vừa khẩu vị.' },
        { instruction: 'Nấu sôi lăn tăn thêm 2 - 3 phút cho đậu hũ ngấm vị, rắc hành ngò thái nhỏ và tiêu xay rồi tắt bếp.' }
      ]
    };
  }

  if (t.includes('canh vịt nấu măng')) {
    return {
      ingredients: [
        { name: 'Thịt vịt', quantity: 600, unit: 'g' },
        { name: 'Măng chua (hoặc măng tươi)', quantity: 300, unit: 'g' },
        { name: 'Gừng tươi', quantity: 1, unit: 'nhánh' },
        { name: 'Hành tím, tỏi băm', quantity: 2, unit: 'củ' },
        { name: 'Mùi tàu (ngò gai), hành lá', quantity: 1, unit: 'ít' },
        { name: 'Gia vị: Nước mắm, hạt nêm, muối, rượu trắng', quantity: 1, unit: 'ít' }
      ],
      steps: [
        { instruction: 'Vịt rửa sạch, chà xát với gừng giã nhuyễn và rượu trắng để khử hoàn toàn mùi hôi, sau đó chặt miếng vừa ăn.' },
        { instruction: 'Măng rửa sạch, luộc qua nước sôi 1 - 2 lần cho bớt chua và đắng, vớt ra xả nước lạnh rồi xé sợi hoặc thái lát.' },
        { instruction: 'Ướp vịt với hành tím, tỏi băm, nước mắm và hạt nêm trong 20 phút. Phi thơm hành tỏi rồi cho vịt vào xào săn.' },
        { instruction: 'Xào riêng măng với chút gia vị cho ngấm, sau đó trút vào nồi vịt. Đổ nước ngập mặt thịt và đun sôi, vớt sạch bọt.' },
        { instruction: 'Hạ nhỏ lửa ninh khoảng 25 - 30 phút cho thịt vịt mềm thơm. Nêm lại gia vị vừa ăn, rắc mùi tàu và hành lá rồi tắt bếp.' }
      ]
    };
  }

  if (t.includes('canh trứng cà chua')) {
    return {
      ingredients: [
        { name: 'Trứng gà', quantity: 2, unit: 'quả' },
        { name: 'Cà chua chín', quantity: 2, unit: 'quả' },
        { name: 'Hành tím băm', quantity: 1, unit: 'củ' },
        { name: 'Hành lá, rau mùi', quantity: 1, unit: 'ít' },
        { name: 'Gia vị: Nước mắm, hạt nêm, dầu ăn, tiêu', quantity: 1, unit: 'ít' }
      ],
      steps: [
        { instruction: 'Cà chua rửa sạch, cắt múi cau. Trứng đập ra bát đánh tan đều. Hành lá thái nhỏ.' },
        { instruction: 'Phi thơm hành tím với chút dầu ăn, cho cà chua vào xào mềm nhuyễn tạo màu đỏ đẹp tự nhiên.' },
        { instruction: 'Đổ khoảng 600ml nước vào đun sôi, nêm nếm gia vị hạt nêm, nước mắm vừa ăn.' },
        { instruction: 'Hạ lửa nhỏ, một tay đổ từ từ bát trứng vào nồi, một tay dùng đũa khuấy nhẹ theo một chiều để tạo vân trứng bông đẹp.' },
        { instruction: 'Đợi nước sôi lăn tăn lại thì rắc hành lá, tiêu xay rồi tắt bếp ngay để trứng mềm ngọt không bị tanh.' }
      ]
    };
  }

  if (t.includes('canh xương hầm bí đao')) {
    return {
      ingredients: [
        { name: 'Xương heo (sườn hoặc xương ống)', quantity: 400, unit: 'g' },
        { name: 'Bí đao', quantity: 400, unit: 'g' },
        { name: 'Hành tím băm', quantity: 2, unit: 'củ' },
        { name: 'Hành lá, ngò rí', quantity: 1, unit: 'ít' },
        { name: 'Gia vị: Muối, nước mắm, hạt nêm, tiêu', quantity: 1, unit: 'ít' }
      ],
      steps: [
        { instruction: 'Xương heo chặt miếng, chần qua nước sôi rửa sạch bọt bẩn để nước canh được trong.' },
        { instruction: 'Bí đao gọt vỏ, bỏ ruột, rửa sạch và cắt miếng dày khoảng 1.5 cm.' },
        { instruction: 'Cho xương vào nồi cùng 1 lít nước và hành tím đập dập, ninh nhỏ lửa khoảng 30 - 40 phút cho ra nước ngọt.' },
        { instruction: 'Thả bí đao vào nồi canh, nêm gia vị hạt nêm và nước mắm vừa khẩu vị. Nấu thêm 5 - 7 phút cho bí chín tới.' },
        { instruction: 'Múc canh ra tô, rắc hành lá, ngò rí và chút tiêu xay lên trên ăn nóng.' }
      ]
    };
  }

  if (t.includes('canh sườn') && t.includes('dưa chua')) {
    return {
      ingredients: [
        { name: 'Sườn non', quantity: 400, unit: 'g' },
        { name: 'Dưa cải chua', quantity: 250, unit: 'g' },
        { name: 'Cà chua', quantity: 2, unit: 'quả' },
        { name: 'Hành tím băm', quantity: 2, unit: 'củ' },
        { name: 'Hành lá, mùi tàu', quantity: 1, unit: 'ít' },
        { name: 'Gia vị: Nước mắm, hạt nêm, dầu ăn', quantity: 1, unit: 'ít' }
      ],
      steps: [
        { instruction: 'Sườn chặt khúc vừa ăn, chần qua nước sôi rồi rửa sạch. Ướp với chút hạt nêm và hành tím.' },
        { instruction: 'Dưa chua rửa sơ cho bớt mặn và chua gắt, vắt nhẹ ráo nước. Cà chua cắt múi cau.' },
        { instruction: 'Phi thơm hành tím, xào săn sườn rồi trút nước vào ninh khoảng 25 - 30 phút cho sườn mềm nhừ.' },
        { instruction: 'Phi thơm hành ở chảo khác, xào cà chua và dưa chua cho ngấm gia vị rồi trút vào nồi sườn.' },
        { instruction: 'Nấu sôi thêm 10 phút cho dưa ngấm nước ngọt từ sườn, nêm lại gia vị vừa ăn, rắc hành lá và mùi tàu rồi tắt bếp.' }
      ]
    };
  }

  if (t.includes('canh nấm rơm đậu hũ')) {
    return {
      ingredients: [
        { name: 'Đậu hũ non', quantity: 2, unit: 'miếng' },
        { name: 'Nấm rơm tươi', quantity: 150, unit: 'g' },
        { name: 'Cà rốt', quantity: 0.5, unit: 'củ' },
        { name: 'Hành lá, ngò rí', quantity: 1, unit: 'ít' },
        { name: 'Gia vị chay: Hạt nêm nấm, muối, tiêu, dầu mè', quantity: 1, unit: 'ít' }
      ],
      steps: [
        { instruction: 'Nấm rơm cắt chân nấm, ngâm nước muối loãng 10 phút rồi rửa sạch, chẻ đôi nấm to. Cà rốt tỉa hoa thái lát.' },
        { instruction: 'Đậu hũ non cắt khối vuông vừa ăn. Hành ngò thái nhỏ.' },
        { instruction: 'Phi thơm phần gốc hành trắng, cho nấm rơm và cà rốt vào xào nhanh với chút hạt nêm nấm.' },
        { instruction: 'Đổ 700ml nước vào đun sôi, sau đó nhẹ nhàng cho đậu hũ non vào nồi.' },
        { instruction: 'Nấu sôi lăn tăn 3 phút, nêm nếm lại gia vị vừa thanh ngọt. Rắc hành ngò, tiêu xay và vài giọt dầu mè rồi tắt bếp.' }
      ]
    };
  }

  if (t.includes('canh rau ngót')) {
    return {
      ingredients: [
        { name: 'Rau ngót', quantity: 1, unit: 'bó' },
        { name: 'Thịt heo băm (hoặc thịt bò xay)', quantity: 150, unit: 'g' },
        { name: 'Hành tím băm', quantity: 1, unit: 'củ' },
        { name: 'Gia vị: Nước mắm, hạt nêm, muối, tiêu', quantity: 1, unit: 'ít' }
      ],
      steps: [
        { instruction: 'Rau ngót tuốt lá, rửa sạch nhiều lần, vò nhẹ cho lá hơi giập để khi nấu canh mềm ngọt nước.' },
        { instruction: 'Thịt băm ướp với chút hạt nêm, tiêu xay và hành tím băm trong 10 phút.' },
        { instruction: 'Phi thơm hành tím, cho thịt băm vào xào săn thơm.' },
        { instruction: 'Cho rau ngót vào xào cùng thịt khoảng 1 - 2 phút cho ngấm vị rồi đổ 750ml nước vào đun sôi.' },
        { instruction: 'Khi canh sôi bùng lên thì vớt bọt, nêm nước mắm và hạt nêm cho vừa miệng, đun thêm 2 phút là tắt bếp.' }
      ]
    };
  }

  if (t.includes('canh kim chi')) {
    return {
      ingredients: [
        { name: 'Kim chi cải thảo', quantity: 200, unit: 'g' },
        { name: 'Thịt ba chỉ heo (hoặc thịt bò)', quantity: 150, unit: 'g' },
        { name: 'Đậu hũ non', quantity: 1, unit: 'hộp' },
        { name: 'Nấm kim châm', quantity: 100, unit: 'g' },
        { name: 'Hành boa-rô (hoặc hành lá)', quantity: 1, unit: 'nhánh' },
        { name: 'Tỏi băm, ớt bột Hàn Quốc', quantity: 1, unit: 'ít' }
      ],
      steps: [
        { instruction: 'Thịt ba chỉ thái miếng mỏng vừa ăn. Kim chi cắt khúc ngắn. Đậu hũ non cắt lát vuông.' },
        { instruction: 'Phi thơm tỏi băm, cho thịt ba chỉ vào xào săn ra bớt mỡ, sau đó cho kim chi vào đảo đều 3 phút.' },
        { instruction: 'Đổ khoảng 600ml nước (hoặc nước dùng dashi/xương) và chút nước kim chi vào đun sôi.' },
        { instruction: 'Hạ nhỏ lửa đun 10 phút cho thịt mềm. Xếp đậu hũ non và nấm kim châm vào nấu sôi thêm 3 phút.' },
        { instruction: 'Nêm nếm lại gia vị vừa ăn, rắc hành boa-rô thái xéo rồi tắt bếp thưởng thức nóng hổi.' }
      ]
    };
  }

  if (t.includes('canh mọc')) {
    return {
      ingredients: [
        { name: 'Giò sống (mọc)', quantity: 200, unit: 'g' },
        { name: 'Mộc nhĩ, nấm hương ngâm nở', quantity: 30, unit: 'g' },
        { name: 'Cà chua, dứa (thơm)', quantity: 1, unit: 'phần' },
        { name: 'Hành lá, mùi tàu', quantity: 1, unit: 'ít' },
        { name: 'Gia vị: Nước mắm, hạt nêm, tiêu', quantity: 1, unit: 'ít' }
      ],
      steps: [
        { instruction: 'Mộc nhĩ, nấm hương băm nhỏ, trộn đều với giò sống và chút tiêu xay. Dùng thìa vo thành từng viên mọc tròn.' },
        { instruction: 'Cà chua bổ múi cau, dứa thái lát xéo mỏng. Hành mùi rửa sạch thái nhỏ.' },
        { instruction: 'Phi thơm hành, xào mềm cà chua rồi đổ nước vào đun sôi.' },
        { instruction: 'Thả từng viên mọc vào nồi nước canh sôi, đun đến khi mọc nổi lên mặt nước là đã chín.' },
        { instruction: 'Cho dứa vào nấu thêm 2 phút, nêm nếm gia vị chua thanh vừa miệng, rắc hành mùi và tắt bếp.' }
      ]
    };
  }

  if (t.includes('canh khổ qua nhồi thịt')) {
    return {
      ingredients: [
        { name: 'Khổ qua (mướp đắng)', quantity: 3, unit: 'trái' },
        { name: 'Thịt heo xay', quantity: 200, unit: 'g' },
        { name: 'Giò sống', quantity: 50, unit: 'g' },
        { name: 'Mộc nhĩ băm nhuyễn', quantity: 15, unit: 'g' },
        { name: 'Hành tím, hành lá', quantity: 1, unit: 'ít' },
        { name: 'Gia vị: Nước mắm, hạt nêm, tiêu', quantity: 1, unit: 'ít' }
      ],
      steps: [
        { instruction: 'Khổ qua cắt khúc, khoét bỏ ruột và hạt, rửa sạch để ráo.' },
        { instruction: 'Trộn đều thịt heo xay, giò sống, mộc nhĩ băm, hành tím băm, tiêu xay và hạt nêm cho dẻo quánh.' },
        { instruction: 'Nhồi nhân thịt vào ruột từng khúc khổ qua, miết phẳng hai đầu.' },
        { instruction: 'Đun sôi 800ml nước dùng xương, thả từng khúc khổ qua nhồi thịt vào hầm lửa vừa, mở nắp hớt bọt để nước canh trong.' },
        { instruction: 'Nấu khoảng 20 - 25 phút cho khổ qua chín mềm, nêm gia vị vừa ăn, rắc hành lá và tiêu thơm rồi tắt bếp.' }
      ]
    };
  }

  if (t.includes('canh khoai mỡ') || t.includes('canh khoai tây')) {
    return {
      ingredients: [
        { name: t.includes('khoai mỡ') ? 'Khoai mỡ tím' : 'Khoai tây, cà rốt', quantity: 350, unit: 'g' },
        { name: 'Sườn heo (hoặc tôm băm / thịt băm)', quantity: 200, unit: 'g' },
        { name: 'Hành tím băm', quantity: 1, unit: 'củ' },
        { name: 'Ngò om, ngò gai (mùi tàu)', quantity: 1, unit: 'ít' },
        { name: 'Gia vị: Nước mắm, hạt nêm, muối, tiêu', quantity: 1, unit: 'ít' }
      ],
      steps: [
        { instruction: 'Khoai nạo nhuyễn (với khoai mỡ) hoặc cắt khúc vuông vừa ăn (với khoai tây). Sườn heo chần sạch nước sôi.' },
        { instruction: 'Ninh sườn với 800ml nước khoảng 20 phút cho mềm và ngọt nước.' },
        { instruction: 'Cho khoai vào nồi nấu cùng sườn, khuấy đều ở lửa vừa đến khi khoai chín nhừ sánh mịn.' },
        { instruction: 'Nêm nước mắm và hạt nêm cho vừa khẩu vị, rắc ngò om ngò gai thái nhỏ rồi tắt bếp múc ra tô.' }
      ]
    };
  }

  if (t.includes('canh hến') || t.includes('canh trai')) {
    return {
      ingredients: [
        { name: 'Thịt hến (hoặc thịt trai) luộc sạch', quantity: 200, unit: 'g' },
        { name: 'Nước luộc hến (lắng trong)', quantity: 700, unit: 'ml' },
        { name: 'Cà chua, dứa (hoặc rau cải)', quantity: 1, unit: 'phần' },
        { name: 'Hành tím, thì là, rau răm', quantity: 1, unit: 'ít' },
        { name: 'Gia vị: Nước mắm, muối, hạt nêm', quantity: 1, unit: 'ít' }
      ],
      steps: [
        { instruction: 'Hến luộc đãi lấy thịt và gạn lấy phần nước trong không cặn. Thịt hến rửa sạch lại.' },
        { instruction: 'Phi thơm hành tím, cho thịt hến vào xào săn với chút nước mắm và hạt nêm rồi trút ra đĩa riêng.' },
        { instruction: 'Đun sôi nồi nước luộc hến, cho cà chua và dứa (hoặc rau cải) vào nấu chín tới.' },
        { instruction: 'Trút phần thịt hến đã xào vào lại nồi canh, nêm nếm gia vị chua ngọt thanh mát.' },
        { instruction: 'Rắc rau răm và thì là thái nhỏ vào nồi rồi tắt bếp thưởng thức.' }
      ]
    };
  }

  if (t.includes('canh hoa thiên lý')) {
    return {
      ingredients: [
        { name: 'Hoa thiên lý', quantity: 200, unit: 'g' },
        { name: 'Thịt heo xay (hoặc tôm băm)', quantity: 150, unit: 'g' },
        { name: 'Hành tím băm', quantity: 1, unit: 'củ' },
        { name: 'Gia vị: Nước mắm, hạt nêm, tiêu', quantity: 1, unit: 'ít' }
      ],
      steps: [
        { instruction: 'Hoa thiên lý nhặt bỏ cuống già, rửa nhẹ tay với nước muối loãng rồi để ráo.' },
        { instruction: 'Thịt xay ướp với chút hạt nêm và hành tím băm.' },
        { instruction: 'Phi thơm hành, cho thịt xay vào xào săn rồi đổ 700ml nước vào đun sôi, vớt bọt.' },
        { instruction: 'Thả hoa thiên lý vào nồi canh sôi bùng, nêm nếm gia vị vừa miệng.' },
        { instruction: 'Hoa thiên lý rất nhanh chín, chỉ cần đun sôi lại khoảng 1 phút là tắt bếp ngay để hoa giữ màu xanh giòn ngọt.' }
      ]
    };
  }

  if (t.includes('canh cá dưa chua')) {
    return {
      ingredients: [
        { name: 'Cá (cá chép, cá lăng hoặc cá hồi)', quantity: 400, unit: 'g' },
        { name: 'Dưa cải chua', quantity: 200, unit: 'g' },
        { name: 'Cà chua', quantity: 2, unit: 'quả' },
        { name: 'Hành tím, tỏi, gừng, thì là, hành lá', quantity: 1, unit: 'ít' },
        { name: 'Gia vị: Nước mắm, hạt nêm, ớt cay', quantity: 1, unit: 'ít' }
      ],
      steps: [
        { instruction: 'Cá làm sạch, cắt khúc, ướp chút muối, tiêu và gừng băm rồi rán sơ hai mặt cho thịt cá săn vàng thơm.' },
        { instruction: 'Phi thơm hành tỏi, xào mềm cà chua rồi cho dưa chua vào xào săn ngấm vị.' },
        { instruction: 'Đổ nước sôi vào nồi dưa chua đun khoảng 10 phút cho ra nước chua ngọt dịu.' },
        { instruction: 'Nhẹ nhàng thả từng khúc cá đã rán vào nồi, đun nhỏ lửa khoảng 15 phút cho cá ngấm vị dưa.' },
        { instruction: 'Nêm lại nước mắm vừa ăn, rắc hành hoa, thì là và lát ớt rồi tắt bếp.' }
      ]
    };
  }

  // 2. BABY WEANING / NUTRITION DISHES (ĂN DẶM CHO BÉ)
  if (t.includes('xúc xích gà')) {
    return {
      ingredients: [
        { name: 'Ức gà tươi', quantity: 150, unit: 'g' },
        { name: 'Lòng đỏ trứng gà', quantity: 1, unit: 'quả' },
        { name: 'Bột bắp (tinh bột ngô)', quantity: 10, unit: 'g' },
        { name: 'Cà rốt hoặc nấm băm nhuyễn', quantity: 20, unit: 'g' },
        { name: 'Dầu ăn cho bé', quantity: 1, unit: 'muỗng cà phê' }
      ],
      steps: [
        { instruction: 'Ức gà rửa sạch, thái nhỏ rồi cho vào máy xay cùng lòng đỏ trứng, bột bắp và chút dầu ăn cho bé, xay thật nhuyễn mịn.' },
        { instruction: 'Trộn đều cà rốt băm nhuyễn vào hỗn hợp thịt gà vừa xay.' },
        { instruction: 'Cho hỗn hợp vào túi bắt kem, bóp thành hình xúc xích lên giấy nến hoặc màng bọc thực phẩm chịu nhiệt rồi cuộn chặt hai đầu.' },
        { instruction: 'Đặt xúc xích vào xửng hấp ở lửa vừa trong khoảng 15 - 20 phút đến khi chín đều.' },
        { instruction: 'Để nguội, bóc bỏ lớp vỏ bọc, có thể cho bé ăn ngay hoặc áp chảo nhẹ cho thơm.' }
      ]
    };
  }

  if (t.includes('trứng hấp tôm cà rốt')) {
    return {
      ingredients: [
        { name: 'Trứng gà', quantity: 1, unit: 'quả' },
        { name: 'Tôm tươi (bóc vỏ, bỏ chỉ đen)', quantity: 30, unit: 'g' },
        { name: 'Cà rốt băm nhuyễn', quantity: 15, unit: 'g' },
        { name: 'Nước lọc (hoặc nước dùng dashi)', quantity: 50, unit: 'ml' },
        { name: 'Dầu ăn em bé', quantity: 0.5, unit: 'muỗng cà phê' }
      ],
      steps: [
        { instruction: 'Tôm rửa sạch, băm nhỏ. Cà rốt bào sợi rồi băm thật nhuyễn.' },
        { instruction: 'Đập trứng gà vào bát, đánh tan đều cùng 50ml nước lọc hoặc dashi, sau đó lọc qua rây cho mịn không bọt.' },
        { instruction: 'Cho tôm băm và cà rốt vào khuấy đều cùng hỗn hợp trứng.' },
        { instruction: 'Dùng màng bọc thực phẩm bọc kín miệng bát, chọc vài lỗ nhỏ thoát hơi.' },
        { instruction: 'Đặt vào nồi hấp cách thủy ở lửa nhỏ trong khoảng 12 - 15 phút đến khi trứng đông mịn như thạch.' }
      ]
    };
  }

  if (t.includes('soup') && t.includes('đậu lăng')) {
    return {
      ingredients: [
        { name: 'Đậu lăng đỏ', quantity: 25, unit: 'g' },
        { name: 'Thịt ức gà', quantity: 30, unit: 'g' },
        { name: 'Khoai tây hoặc cà rốt', quantity: 20, unit: 'g' },
        { name: 'Nước dùng dashi hoặc nước hầm gà', quantity: 180, unit: 'ml' },
        { name: 'Dầu ô liu cho bé', quantity: 0.5, unit: 'muỗng cà phê' }
      ],
      steps: [
        { instruction: 'Đậu lăng đỏ ngâm nước ấm 20 phút rồi rửa sạch. Ức gà rửa sạch băm nhỏ. Khoai tây gọt vỏ thái hạt lựu.' },
        { instruction: 'Cho đậu lăng, khoai tây và nước dùng vào nồi đun sôi, hạ nhỏ lửa ninh khoảng 15 phút cho đậu lăng chín nhừ.' },
        { instruction: 'Cho thịt gà băm vào khuấy đều nấu tiếp 5 phút cho thịt chín ngọt.' },
        { instruction: 'Dùng máy xay cầm tay xay mịn súp theo độ thô phù hợp lứa tuổi của bé.' },
        { instruction: 'Múc súp ra bát, trộn thêm vài giọt dầu ô liu cho bé và cho bé thưởng thức khi còn ấm.' }
      ]
    };
  }

  if (t.includes('soup tôm khoai tây')) {
    return {
      ingredients: [
        { name: 'Tôm tươi', quantity: 35, unit: 'g' },
        { name: 'Khoai tây', quantity: 40, unit: 'g' },
        { name: 'Cà rốt', quantity: 15, unit: 'g' },
        { name: 'Sữa tươi không đường (hoặc sữa công thức/nước dùng)', quantity: 50, unit: 'ml' },
        { name: 'Dầu ăn em bé', quantity: 0.5, unit: 'muỗng cà phê' }
      ],
      steps: [
        { instruction: 'Tôm lột vỏ, bỏ đầu và chỉ đen, băm nhỏ. Khoai tây và cà rốt gọt vỏ, thái hạt lựu nhỏ.' },
        { instruction: 'Hấp hoặc luộc chín mềm khoai tây và cà rốt, sau đó nghiền nhuyễn mịn.' },
        { instruction: 'Xào nhanh tôm với chút dầu ăn em bé cho tôm chuyển màu hồng chín thơm.' },
        { instruction: 'Cho khoai tây, cà rốt nghiền, tôm và sữa vào nồi nhỏ, khuấy đều ở lửa nhỏ cho súp sôi lăn tăn hòa quyện.' },
        { instruction: 'Tắt bếp, múc súp ra bát cho bé thưởng thức.' }
      ]
    };
  }

  if (t.includes('soup nấm gà hạt kê')) {
    return {
      ingredients: [
        { name: 'Hạt kê', quantity: 20, unit: 'g' },
        { name: 'Thịt ức gà', quantity: 30, unit: 'g' },
        { name: 'Nấm đùi gà (hoặc nấm hương tươi)', quantity: 15, unit: 'g' },
        { name: 'Nước dùng gà', quantity: 180, unit: 'ml' },
        { name: 'Dầu mè cho bé', quantity: 0.5, unit: 'muỗng cà phê' }
      ],
      steps: [
        { instruction: 'Hạt kê vo sạch ngâm 30 phút. Ức gà và nấm băm nhuyễn mịn.' },
        { instruction: 'Cho hạt kê và nước dùng vào nồi ninh nhỏ lửa khoảng 15 phút cho hạt kê nở bung sánh.' },
        { instruction: 'Xào thơm thịt gà và nấm rồi trút vào nồi súp kê khuấy đều.' },
        { instruction: 'Nấu thêm 5 phút cho các nguyên liệu chín nhừ hòa quyện, nêm chút dầu mè thơm rồi tắt bếp.' }
      ]
    };
  }

  if (t.includes('soup lươn bí đỏ')) {
    return {
      ingredients: [
        { name: 'Thịt lươn đồng làm sạch', quantity: 35, unit: 'g' },
        { name: 'Bí đỏ', quantity: 40, unit: 'g' },
        { name: 'Gừng tươi', quantity: 1, unit: 'lát nhỏ' },
        { name: 'Nước dashi', quantity: 150, unit: 'ml' },
        { name: 'Dầu ăn em bé', quantity: 0.5, unit: 'muỗng cà phê' }
      ],
      steps: [
        { instruction: 'Lươn hấp chín cùng lát gừng để khử tanh, sau đó gỡ lấy thịt và băm nhỏ, kiểm tra kỹ xương.' },
        { instruction: 'Bí đỏ gọt vỏ, hấp chín mềm rồi tán nhuyễn.' },
        { instruction: 'Đun sôi nước dashi, cho bí đỏ tán nhuyễn và thịt lươn vào khuấy đều ở lửa nhỏ.' },
        { instruction: 'Nấu sôi nhẹ khoảng 3 - 5 phút cho súp sánh mịn, tắt bếp thêm dầu ăn em bé khuấy đều.' }
      ]
    };
  }

  if (t.includes('sandwich tôm nướng')) {
    return {
      ingredients: [
        { name: 'Bánh mì sandwich', quantity: 2, unit: 'lát' },
        { name: 'Tôm tươi băm nhuyễn', quantity: 50, unit: 'g' },
        { name: 'Lòng trắng trứng', quantity: 1, unit: 'ít' },
        { name: 'Phô mai tách muối', quantity: 1, unit: 'lát' }
      ],
      steps: [
        { instruction: 'Tôm băm nhuyễn trộn cùng chút lòng trắng trứng và tiêu/hành băm nhuyễn.' },
        { instruction: 'Cắt bỏ viền bánh mì sandwich, cắt đôi thành hình tam giác.' },
        { instruction: 'Phết đều lớp tôm băm lên mặt bánh mì, đặt phô mai lên trên.' },
        { instruction: 'Nướng bằng nồi chiên không dầu ở 160°C trong 8 - 10 phút đến khi tôm chín hồng và bánh giòn rụm.' }
      ]
    };
  }

  if (t.includes('bánh đúc thịt heo')) {
    return {
      ingredients: [
        { name: 'Bột gạo', quantity: 50, unit: 'g' },
        { name: 'Bột năng', quantity: 15, unit: 'g' },
        { name: 'Nước lọc', quantity: 200, unit: 'ml' },
        { name: 'Thịt heo xay', quantity: 40, unit: 'g' },
        { name: 'Mộc nhĩ, nấm hương ngâm nở băm nhỏ', quantity: 15, unit: 'g' }
      ],
      steps: [
        { instruction: 'Hòa tan bột gạo, bột năng và nước lọc trong nồi nhỏ, để nghỉ 15 phút.' },
        { instruction: 'Xào chín thịt heo xay với mộc nhĩ, nấm hương cho thơm.' },
        { instruction: 'Bắc nồi bột lên bếp khuấy đều tay liên tục ở lửa nhỏ đến khi bột đặc sánh, trong và mịn màng.' },
        { instruction: 'Múc bánh đúc nóng ra bát nhỏ, xúc phần nhân thịt xào nấm lên trên và thưởng thức.' }
      ]
    };
  }

  // 3. GENERIC REASONABLE FALLBACK BASED ON TITLE
  return {
    ingredients: [
      { name: title.replace(/^(cách nấu|cách làm|món)\s+/i, ''), quantity: 1, unit: 'phần' },
      { name: 'Gia vị thông dụng (hành, tiêu, muối, nước mắm)', quantity: 1, unit: 'ít' }
    ],
    steps: [
      { instruction: `Sơ chế và chuẩn bị đầy đủ các nguyên liệu cho món ${title}.` },
      { instruction: `Tiến hành chế biến món ${title} theo các bước nấu tiêu chuẩn, nêm nếm gia vị vừa khẩu vị gia đình.` },
      { instruction: `Trình bày món ăn ra đĩa hoặc tô, thưởng thức khi còn nóng.` }
    ]
  };
}

module.exports = {
  generateDishDetails
};
